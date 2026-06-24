/**
 * &FRIENDS — firebase-store.js
 *
 * Architecture: sync cache + async fetchers.
 *
 *   • Sync  getters  (getAll / getById / getSession) read in-memory cache instantly.
 *   • Async fetchers (fetchAll / fetchPublished / fetch) hit Firestore, update cache,
 *     then emit a DOM event so pages re-render.
 *   • Auth state is kept by onAuthStateChanged → _cache.session (always sync-readable).
 *
 * DOM events emitted:
 *   'af:auth'    — auth state changed   (detail: session | null)
 *   'af:events'  — events cache updated (detail: events[])
 *   'af:gallery' — gallery updated      (detail: campaigns[])
 *   'af:content' — content updated      (detail: content{})
 *   'af:tickets' — tickets updated      (detail: tickets[])
 *   'af:users'   — users updated        (detail: users[])
 */

const Store = (() => {

    // ── Firebase service handles ─────────────────────────────────────
    let _auth, _db, _storage;

    // ── In-memory sync cache ─────────────────────────────────────────
    const _cache = {
        session: null,
        events: [],
        gallery: [],
        content: null,
        tickets: [],
        users: [],
    };

    // ── Helpers ──────────────────────────────────────────────────────
    const uid = () => 'id_' + Math.random().toString(36).slice(2, 11);
    const ts = () => new Date().toISOString();
    const emit = (name, detail) =>
        document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));

    function rootPath() {
        const p = window.location.pathname;
        return (p.includes('/html/') || p.includes('/admin/') || p.includes('/resident/'))
            ? '../' : '';
    }

    // Add this helper function to ensure auth before any Firestore operation
async function _waitForAuthAndInit() {
    if (!_authReady) {
        console.log('[&FRIENDS] Waiting for auth to initialize...');
        await _authReadyPromise;
        console.log('[&FRIENDS] Auth initialized, session:', _cache.session ? 'present' : 'none');
    }
    return _cache.session;
}

    const docToObj = d => d.exists ? { id: d.id, ...d.data() } : null;
    const snapArr = s => s.docs.map(d => ({ id: d.id, ...d.data() }));

    /** Sanitise a filename for Firebase Storage paths */
    function _safeName(name) {
        return name
            .replace(/[^a-zA-Z0-9.\-_]/g, '_')  // replace unsafe chars with _
            .replace(/_+/g, '_')                  // collapse multiple _
            .toLowerCase();
    }


    // ── Firestore query with hard timeout ────────────────────────────
    // Prevents any Firestore query from hanging forever.
    async function _fsGet(queryRef, ms = 12000) {
        const timer = new Promise((_, rej) =>
            setTimeout(() => rej(new Error('Firestore timed out after ' + ms + 'ms')), ms)
        );
        return Promise.race([queryRef.get(), timer]);
    }

    // ── Firebase init ────────────────────────────────────────────────
    (function _init() {
        try {
            // firebase-config.js already called firebase.initializeApp()
            // so we just grab the handles — never call initializeApp again.
            _auth = firebase.auth();
            _db = firebase.firestore();

            // Use firebase.storage() with no argument — it reads storageBucket from the
            // already-initialised app config (supports both .appspot.com and .firebasestorage.app)
            _storage = firebase.storage();

            // NOTE: Auth state is handled by _authReadyPromise below.
            // Do NOT add a second onAuthStateChanged here — it would race with that one
            // and emit 'af:auth' at the wrong time, breaking admin auth guards.

        } catch (err) {
            console.error('[&FRIENDS] Firebase init failed:', err);
        }
    })();

    // ── Upload a File to Firebase Storage ────────────────────────────
    // Returns: Firebase Storage download URL (string)
    // Throws:  Error with descriptive message if upload fails
    async function _upload(file, folder) {
        if (!_storage) throw new Error('Firebase Storage is not initialised.');
        if (!file || !(file instanceof File || file instanceof Blob)) {
            throw new Error('Invalid file provided to _upload.');
        }

        const safeName = `${Date.now()}_${_safeName(file.name)}`;
        const path = `${folder}/${safeName}`;

        try {
            const ref = _storage.ref(path);
            // Race the upload against a 30-second timeout so it never hangs
            const uploadTimeout = new Promise((_, rej) =>
                setTimeout(() => rej(new Error('Storage upload timed out after 30s')), 30000)
            );
            const snap = await Promise.race([
                ref.put(file, { contentType: file.type || 'image/jpeg' }),
                uploadTimeout
            ]);
            const url = await snap.ref.getDownloadURL();
            return url;
        } catch (err) {
            // Re-throw with a clear message
            const msg = err.code === 'storage/unauthorized'
                ? 'Storage permission denied. Check Firebase Storage Rules — allow write: if request.auth != null.'
                : (err.message || String(err));
            throw new Error(msg);
        }
    }

    // ── Convert File to base64 data URL (fallback if Storage fails) ──
    function _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('FileReader failed'));
            reader.readAsDataURL(file);
        });
    }

    // ── Upload with automatic base64 fallback ────────────────────────
    // First tries Firebase Storage. If that fails, falls back to base64.
    // ALWAYS returns a plain string URL — never an object, never throws.
    async function _uploadWithFallback(file, folder) {
        try {
            const url = await _upload(file, folder);
            console.log('[&FRIENDS] Storage upload success:', url);
            return url;   // plain string
        } catch (storageErr) {
            console.warn('[&FRIENDS] Storage upload failed, using base64 fallback:', storageErr.message);
            try {
                return await _fileToBase64(file);   // plain string data URL
            } catch (b64Err) {
                console.error('[&FRIENDS] Base64 fallback also failed:', b64Err);
                return '';
            }
        }
    }

    // ================================================================
    //  AUTH
    // ================================================================
    // ================================================================
    // AUTH
    // ================================================================

    let _authReady = false;

    const _authReadyPromise = new Promise(resolve => {

        // Persistent listener — stays active for the lifetime of the page
        // so session stays in sync if the user logs out or switches accounts.
        _auth.onAuthStateChanged(async fbUser => {

            try {

                if (fbUser) {

                    let profile = null;

                    try {
                        // Race the profile fetch against a 5-second timeout.
                        // If Firestore rules block the users collection, the fetch
                        // would hang forever — this prevents that from happening.
                        const profileTimeout = new Promise((_, rej) =>
                            setTimeout(() => rej(new Error('profile fetch timeout')), 5000)
                        );
                        const doc = await Promise.race([
                            _db.collection('users').doc(fbUser.uid).get(),
                            profileTimeout
                        ]);

                        if (doc.exists) {
                            profile = doc.data();
                        }

                    } catch (profileErr) {
                        // Timed out or denied — continue with basic user info from Firebase Auth
                        console.warn(
                            '[&FRIENDS] Profile fetch skipped (timeout or rules):', profileErr.message
                        );
                    }

                    _cache.session = {
                        id: fbUser.uid,

                        name:
                            profile?.name ||
                            fbUser.displayName ||
                            fbUser.email.split('@')[0],

                        email: fbUser.email,

                        role:
                            profile?.role || 'resident',

                        phone:
                            profile?.phone || '',

                        dob:
                            profile?.dob || '',
                    };

                } else {

                    _cache.session = null;
                }

            } catch (err) {

                console.error('[&FRIENDS] Auth restore failed:', err);

                // Still resolve with basic auth info so the page doesn't hang
                if (fbUser) {
                    _cache.session = {
                        id: fbUser.uid,
                        name: fbUser.displayName || fbUser.email.split('@')[0],
                        email: fbUser.email,
                        role: 'resident',
                        phone: '', dob: '',
                    };
                } else {
                    _cache.session = null;
                }
            }

            _authReady = true;

            emit('af:auth', _cache.session);

            resolve(true); // Only resolves the promise once; subsequent fires just update cache
        });

    });

    const Auth = {

        // ------------------------------------------------------------
        // Session
        // ------------------------------------------------------------

        getSession() {
            return _cache.session;
        },

        isLoggedIn() {
            return !!_cache.session;
        },

        isAdmin() {
            return _cache.session?.role === 'admin';
        },

        isResident() {
            return _cache.session?.role === 'resident';
        },

        getCurrentUser() {
            return _auth?.currentUser || null;
        },

        async waitForAuth() {

            if (_authReady) {
                return _cache.session;
            }

            // Hard 6-second timeout — if auth never resolves (offline / SDK issue),
            // we still proceed rather than hanging the page forever.
            await Promise.race([
                _authReadyPromise,
                new Promise(resolve => setTimeout(resolve, 6000))
            ]);

            return _cache.session;
        },

        // ------------------------------------------------------------
        // Route Guards
        // ------------------------------------------------------------

        async requireAdmin() {

            await this.waitForAuth();

            if (!this.isAdmin()) {

                window.location.href =
                    rootPath() + 'html/index.html';

                return false;
            }

            return true;
        },

        async requireResident() {

            await this.waitForAuth();

            if (!this.isLoggedIn()) {

                window.location.href =
                    rootPath() + 'html/index.html';

                return false;
            }

            return true;
        },

        // ------------------------------------------------------------
        // Login
        // ------------------------------------------------------------

        async login(email, password) {

            try {

                const cred =
                    await _auth.signInWithEmailAndPassword(
                        email,
                        password
                    );

                const fbUser = cred.user;

                if (!fbUser) {

                    return {
                        ok: false,
                        error: 'Authentication failed.'
                    };
                }

                let profile = null;

                try {

                    const doc = await _db
                        .collection('users')
                        .doc(fbUser.uid)
                        .get();

                    if (doc.exists) {
                        profile = doc.data();
                    }

                } catch (profileErr) {

                    console.warn(
                        '[&FRIENDS] Profile load failed:',
                        profileErr
                    );
                }

                _cache.session = {

                    id: fbUser.uid,

                    name:
                        profile?.name ||
                        fbUser.displayName ||
                        fbUser.email.split('@')[0],

                    email: fbUser.email,

                    role:
                        profile?.role || 'resident',

                    phone:
                        profile?.phone || '',

                    dob:
                        profile?.dob || '',
                };

                emit('af:auth', _cache.session);

                return {
                    ok: true,
                    user: _cache.session
                };

            } catch (err) {

                console.error('[&FRIENDS] Login error:', err);

                return {
                    ok: false,
                    error: _authMsg(
                        err.code,
                        err.message
                    )
                };
            }
        },

        // ------------------------------------------------------------
        // Register
        // ------------------------------------------------------------

        async register(data) {

            const ADMIN_CODE = 'ANDFRIENDS2026';

            if (
                data.role === 'admin' &&
                data.adminCode !== ADMIN_CODE
            ) {

                return {
                    ok: false,
                    error: 'Invalid admin access code.'
                };
            }

            try {

                const cred =
                    await _auth.createUserWithEmailAndPassword(
                        data.email,
                        data.password
                    );

                await cred.user.updateProfile({
                    displayName: data.name
                });

                await _db
                    .collection('users')
                    .doc(cred.user.uid)
                    .set({

                        name: data.name,
                        email: data.email,

                        phone:
                            data.phone || '',

                        dob:
                            data.dob || '',

                        role:
                            data.role || 'resident',

                        createdAt: ts(),
                    });

                _cache.session = {

                    id: cred.user.uid,

                    name: data.name,

                    email: data.email,

                    role:
                        data.role || 'resident',

                    phone:
                        data.phone || '',

                    dob:
                        data.dob || '',
                };

                emit('af:auth', _cache.session);

                return {
                    ok: true,
                    user: _cache.session
                };

            } catch (err) {

                return {
                    ok: false,
                    error: _authMsg(
                        err.code,
                        err.message
                    )
                };
            }
        },

        // ------------------------------------------------------------
        // Logout
        // ------------------------------------------------------------

        async logout() {

            await _auth.signOut();

            _cache.session = null;

            emit('af:auth', null);
        },
    };

    /*
  
    function _waitForSession(ms) {
      return new Promise(resolve => {
        if (_cache.session) { resolve(); return; }
        const unsub = _auth.onAuthStateChanged(() => {
          clearTimeout(t); unsub();
          setTimeout(resolve, 250);
        });
        const t = setTimeout(() => { unsub(); resolve(); }, ms);
      });
    }
      */

   // ================================================================
//  EVENTS
// ================================================================
// ================================================================
//  EVENTS
// ================================================================
const Events = {

    getAll() { return _cache.events; },
    getPublished() { return _cache.events.filter(e => e.status === 'published'); },
    getFeatured() { return _cache.events.filter(e => e.status === 'published' && e.featured); },
    getById(id) { return _cache.events.find(e => e.id === id) || null; },

    async fetchAll() {
        let snap;
        try {
            snap = await _fsGet(_db.collection('events').orderBy('createdAt', 'desc'));
        } catch (err) {
            console.warn('[&FRIENDS] events fetchAll (ordered) failed:', err.message);
            try {
                snap = await _fsGet(_db.collection('events'));
            } catch (err2) {
                console.error('[&FRIENDS] events fetchAll failed completely:', err2.message);
                emit('af:events', _cache.events);
                return _cache.events;
            }
        }
        _cache.events = snapArr(snap);
        emit('af:events', _cache.events);
        return _cache.events;
    },

    async fetchPublished() {
        let snap;
        try {
            snap = await _fsGet(_db.collection('events').where('status', '==', 'published'));
        } catch (err) {
            console.warn('[&FRIENDS] fetchPublished failed, falling back:', err.message);
            try {
                snap = await _fsGet(_db.collection('events'));
            } catch (err2) {
                console.error('[&FRIENDS] fetchPublished failed completely:', err2.message);
                emit('af:events', _cache.events);
                return _cache.events;
            }
        }
        _cache.events = snapArr(snap)
            .filter(e => e.status === 'published')
            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        emit('af:events', _cache.events);
        return _cache.events;
    },

    async create(data) {
        // Create a slug from the title (like your original code)
        let slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        // Remove leading/trailing hyphens
        slug = slug.replace(/^-+|-+$/g, '');
        // Add timestamp to ensure uniqueness
        const eventId = `${slug}-${Date.now()}`;
        
        // Ensure image is a string
        const imageUrl = data.image && typeof data.image === 'string' ? data.image : '';
        
        const event = { 
            ...data, 
            image: imageUrl,
            status: data.status || 'draft', 
            createdAt: ts(), 
            updatedAt: ts() 
        };
        
        await _db.collection('events').doc(eventId).set(event);
        event.id = eventId;
        _cache.events.unshift(event);
        emit('af:events', _cache.events);
        return event;
    },

    async update(id, data) {
        // Get the existing event to preserve fields
        const existingEvent = this.getById(id);
        
        // Create patch object - only update fields that are provided
        const patch = { updatedAt: ts() };
        
        // List of fields that can be updated
        const updatableFields = ['title', 'tag', 'date', 'time', 'location', 'description', 
                                  'lineup', 'tickets', 'status', 'featured', 'image'];
        
        for (const field of updatableFields) {
            if (data[field] !== undefined) {
                // Special handling for image: only update if it's a valid string and not empty
                if (field === 'image') {
                    if (data.image && typeof data.image === 'string' && data.image !== '') {
                        patch.image = data.image;
                    }
                    // If image is not provided or empty, don't include it in patch
                    // This preserves the existing image
                } else {
                    patch[field] = data[field];
                }
            }
        }
        
        // If image wasn't updated but we have an existing image, preserve it
        if (patch.image === undefined && existingEvent && existingEvent.image) {
            // Don't include image in patch - this preserves the existing one
            // We need to ensure we don't overwrite it with undefined
        }
        
        console.log('[&FRIENDS] Updating event:', id, patch);
        
        await _db.collection('events').doc(id).update(patch);
        
        const idx = _cache.events.findIndex(e => e.id === id);
        if (idx !== -1) {
            _cache.events[idx] = { ..._cache.events[idx], ...patch };
        }
        
        emit('af:events', _cache.events);
        return _cache.events[idx] || null;
    },

    async delete(id) {
        await _db.collection('events').doc(id).delete();
        _cache.events = _cache.events.filter(e => e.id !== id);
        emit('af:events', _cache.events);
    },

    /**
     * Upload an event image.
     * Returns a plain string URL (Firebase or base64)
     */
    async uploadImage(file, eventId) {
        return _uploadWithFallback(file, 'events/' + (eventId || uid()));
    },
};

    // ================================================================
    //  GALLERY
    // ================================================================
    const Gallery = {

        getAll() { return _cache.gallery; },
        getPublished() { return _cache.gallery.filter(g => g.published); },
        getById(id) { return _cache.gallery.find(g => g.id === id) || null; },

        async fetchAll() {
            let snap;
            try {
                snap = await _fsGet(_db.collection('gallery').orderBy('createdAt', 'desc'));
            } catch (err) {
                console.warn('[&FRIENDS] gallery fetchAll failed, falling back:', err.message);
                try { snap = await _fsGet(_db.collection('gallery')); }
                catch (e) { emit('af:gallery', _cache.gallery); return _cache.gallery; }
            }
            _cache.gallery = snapArr(snap);
            emit('af:gallery', _cache.gallery);
            return _cache.gallery;
        },

        async fetchPublished() {
            let snap;
            try { snap = await _fsGet(_db.collection('gallery').where('published', '==', true)); }
            catch (e) {
                try { snap = await _fsGet(_db.collection('gallery')); }
                catch (e2) { emit('af:gallery', _cache.gallery); return _cache.gallery; }
            }
            // reassign snap reference for the sort below (filter handled inline)
            const snap_pub = snap;
            _cache.gallery = snapArr(snap_pub)
                .filter(g => g.published)
                .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            emit('af:gallery', _cache.gallery);
            return _cache.gallery;
        },

        async createCampaign(data) {
            const id = uid();
            const campaign = { ...data, images: [], published: !!data.published, createdAt: ts() };
            await _db.collection('gallery').doc(id).set(campaign);
            campaign.id = id;
            _cache.gallery.unshift(campaign);
            emit('af:gallery', _cache.gallery);
            return campaign;
        },

        async updateCampaign(id, data) {
            const patch = { ...data, updatedAt: ts() };
            await _db.collection('gallery').doc(id).update(patch);
            const idx = _cache.gallery.findIndex(g => g.id === id);
            if (idx !== -1) _cache.gallery[idx] = { ..._cache.gallery[idx], ...patch };
            emit('af:gallery', _cache.gallery);
            return _cache.gallery[idx] || null;
        },

        async deleteCampaign(id) {
            await _db.collection('gallery').doc(id).delete();
            _cache.gallery = _cache.gallery.filter(g => g.id !== id);
            emit('af:gallery', _cache.gallery);
        },

        async addImage(campaignId, imageData) {
            const idx = _cache.gallery.findIndex(g => g.id === campaignId);
            if (idx === -1) throw new Error(`Campaign ${campaignId} not found in cache.`);
            const img = { id: uid(), ...imageData, addedAt: ts() };
            const images = [...(_cache.gallery[idx].images || []), img];
            await _db.collection('gallery').doc(campaignId).update({ images, updatedAt: ts() });
            _cache.gallery[idx].images = images;
            emit('af:gallery', _cache.gallery);
            return img;
        },

        async deleteImage(campaignId, imageId) {
            const idx = _cache.gallery.findIndex(g => g.id === campaignId);
            if (idx === -1) return;
            const images = (_cache.gallery[idx].images || []).filter(i => i.id !== imageId);
            await _db.collection('gallery').doc(campaignId).update({ images, updatedAt: ts() });
            _cache.gallery[idx].images = images;
            emit('af:gallery', _cache.gallery);
        },

        /**
         * Upload a gallery image.
         * Returns { url, source } — source is 'firebase' or 'base64'.
         * Never throws.
         */
        async uploadImage(file, campaignId) {
            return _uploadWithFallback(file, 'gallery/' + (campaignId || uid()));
        },
    };

    // ================================================================
    //  CONTENT
    // ================================================================
    const Content = {

        get() { return _cache.content; },
        getSection(key) { return _cache.content ? _cache.content[key] : null; },

        async fetch() {
            const doc = await _db.collection('content').doc('site').get();
            _cache.content = doc.exists ? doc.data() : null;
            emit('af:content', _cache.content);
            return _cache.content;
        },

        async updateSection(key, data) {
            if (!_cache.content) _cache.content = {};
            _cache.content[key] = { ...(_cache.content[key] || {}), ...data };
            const patch = {};
            Object.keys(data).forEach(k => { patch[`${key}.${k}`] = data[k]; });
            await _db.collection('content').doc('site').update(patch)
                .catch(() => _db.collection('content').doc('site').set(_cache.content));
            emit('af:content', _cache.content);
            return _cache.content[key];
        },

        async uploadImage(file, section) {
            return _uploadWithFallback(file, 'content/' + section);
        },
    };

    // ================================================================
    //  TICKETS
    // ================================================================
    const Tickets = {

        getAll() { return _cache.tickets; },
        getByUser(userId) { return _cache.tickets.filter(t => t.userId === userId); },
        getById(id) { return _cache.tickets.find(t => t.id === id) || null; },

        async fetchAll() {
            let snap;
            try {
                snap = await _fsGet(_db.collection('tickets').orderBy('purchasedAt', 'desc'));
            } catch (err) {
                console.warn('[&FRIENDS] tickets fetchAll failed, falling back:', err.message);
                try { snap = await _fsGet(_db.collection('tickets')); }
                catch (e) { emit('af:tickets', _cache.tickets); return _cache.tickets; }
            }
            _cache.tickets = snapArr(snap);
            emit('af:tickets', _cache.tickets);
            return _cache.tickets;
        },

        async fetchByUser(userId) {
            const snap = await _fsGet(_db.collection('tickets').where('userId', '==', userId));
            const fresh = snapArr(snap)
                .sort((a, b) => (b.purchasedAt || '').localeCompare(a.purchasedAt || ''));
            fresh.forEach(t => {
                if (!_cache.tickets.find(x => x.id === t.id)) _cache.tickets.push(t);
            });
            emit('af:tickets', _cache.tickets);
            return fresh;
        },

        async purchase(eventId, tier, quantity, user) {
            const event = Events.getById(eventId);
            if (!event) return { ok: false, error: 'Event not found.' };
            const tierData = (event.tickets || []).find(t => t.tier === tier);
            if (!tierData || !tierData.available)
                return { ok: false, error: 'Selected ticket tier unavailable.' };
            const ticketId = 'TKT-' + Math.random().toString(36).slice(2, 10).toUpperCase();
            const ticket = {
                userId: user.id, userName: user.name, userEmail: user.email,
                eventId, eventTitle: event.title, eventDate: event.date,
                eventTime: event.time, eventLocation: event.location,
                eventImage: event.image, tag: event.tag, tier,
                price: tierData.price, quantity, total: tierData.price * quantity,
                purchasedAt: ts(), validated: false,
            };
            await _db.collection('tickets').doc(ticketId).set(ticket);
            const full = { id: ticketId, ...ticket };
            _cache.tickets.unshift(full);
            emit('af:tickets', _cache.tickets);
            return { ok: true, ticket: full };
        },

        async validate(ticketId) {
            const ticket = this.getById(ticketId);
            if (!ticket) return { ok: false, error: 'Ticket not found.' };
            if (ticket.validated) return { ok: false, error: 'Ticket already used.' };
            const now = ts();
            await _db.collection('tickets').doc(ticketId).update({ validated: true, validatedAt: now });
            const idx = _cache.tickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) { _cache.tickets[idx].validated = true; _cache.tickets[idx].validatedAt = now; }
            emit('af:tickets', _cache.tickets);
            return { ok: true, ticket: _cache.tickets[idx] };
        },
    };

    // ================================================================
    //  USERS
    // ================================================================
    const Users = {

        getAll() { return _cache.users; },
        getById(id) { return _cache.users.find(u => u.id === id) || null; },

        async fetchAll() {
            let snap;
            try {
                snap = await _fsGet(_db.collection('users').orderBy('createdAt', 'desc'));
            } catch (err) {
                console.warn('[&FRIENDS] users fetchAll failed, falling back:', err.message);
                try { snap = await _fsGet(_db.collection('users')); }
                catch (e) { emit('af:users', _cache.users); return _cache.users; }
            }
            _cache.users = snapArr(snap).map(u => ({ ...u, password: '••••••••' }));
            emit('af:users', _cache.users);
            return _cache.users;
        },

        async updateRole(id, role) {
            await _db.collection('users').doc(id).update({ role });
            const idx = _cache.users.findIndex(u => u.id === id);
            if (idx !== -1) _cache.users[idx].role = role;
            emit('af:users', _cache.users);
            return _cache.users[idx] || null;
        },

        async delete(id) {
            await _db.collection('users').doc(id).delete();
            _cache.users = _cache.users.filter(u => u.id !== id);
            emit('af:users', _cache.users);
        },

        async updateProfile(id, data) {
            const patch = {};
            ['name', 'phone', 'dob'].forEach(k => { if (data[k] !== undefined) patch[k] = data[k]; });
            if (Object.keys(patch).length) await _db.collection('users').doc(id).update(patch);
            if (data.password && _auth.currentUser?.uid === id)
                await _auth.currentUser.updatePassword(data.password);
            const idx = _cache.users.findIndex(u => u.id === id);
            if (idx !== -1) Object.assign(_cache.users[idx], patch);
            if (_cache.session?.id === id && patch.name) _cache.session.name = patch.name;
            emit('af:users', _cache.users);
            return _cache.users[idx] || null;
        },
    };

    // ================================================================
    //  STORAGE (direct util — same as above but explicit API)
    // ================================================================
    const Storage = {
        async upload(file, path = 'uploads') {
            return _uploadWithFallback(file, path);
        },
        async delete(url) {
            if (!_storage) return;
            const ref = _storage.refFromURL(url);
            await ref.delete();
        },
    };

    // ── Auth error messages ──────────────────────────────────────────
    function _authMsg(code, message) {
        const raw = (code || '') + ' ' + (message || '');
        if (raw.includes('user-not-found') || raw.includes('USER_NOT_FOUND')) return 'No account found with this email.';
        if (raw.includes('wrong-password') || raw.includes('INVALID_PASSWORD')) return 'Incorrect password.';
        if (raw.includes('invalid-credential') || raw.includes('INVALID_LOGIN_CREDENTIALS')) return 'Invalid email or password.';
        if (raw.includes('invalid-email') || raw.includes('INVALID_EMAIL')) return 'Please enter a valid email address.';
        if (raw.includes('email-already-in-use') || raw.includes('EMAIL_EXISTS')) return 'An account with this email already exists.';
        if (raw.includes('weak-password') || raw.includes('WEAK_PASSWORD')) return 'Password must be at least 6 characters.';
        if (raw.includes('too-many-requests') || raw.includes('TOO_MANY_ATTEMPTS')) return 'Too many attempts. Please try again later.';
        if (raw.includes('network-request-failed')) return 'Network error. Check your connection.';
        if (raw.includes('operation-not-allowed') || raw.includes('OPERATION_NOT_ALLOWED')) return 'Email/password sign-up is not enabled in Firebase console.';
        if (raw.includes('admin-restricted-operation')) return 'Registration is restricted. Contact the administrator.';
        const cleaned = (message || code || '').replace(/\(.*?\)/g, '').replace(/https?:\/\/\S+/g, '').trim();
        return cleaned || 'Something went wrong. Please try again.';
    }

    return { Auth, Events, Tickets, Gallery, Content, Users, Storage, uid, ts, rootPath };

})();