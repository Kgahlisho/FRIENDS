/**
 * &FRIENDS — store.js
 * Single source of truth. All pages read and write through here.
 * When the backend is integrated, only this file changes — no UI rewrites.
 */

const Store = (() => {

  // ─── Storage keys ────────────────────────────────────────────────
  const K = {
    users:   'af_users',
    session: 'af_session',
    events:  'af_events',
    tickets: 'af_tickets',
    gallery: 'af_gallery',
    content: 'af_content',
  };

  const read  = k => JSON.parse(localStorage.getItem(k) || 'null');
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid   = () => 'id_' + Math.random().toString(36).slice(2, 11);
  const ts    = () => new Date().toISOString();

  // ─── Seed on first run ──────────────────────────────────────────
  function seed() {

    // Default admin account
    if (!read(K.users)) {
      write(K.users, [
        {
          id: 'admin_001',
          name: 'Site Admin',
          email: 'admin@andfriends.co.za',
          password: 'admin1234',
          phone: '',
          dob: '',
          role: 'admin',
          createdAt: ts()
        }
      ]);
    }

    if (!read(K.events)) {
      write(K.events, [
        {
          id: 'bongeziwe-mabandla-march2026',
          title: 'Bongeziwe Mabandla',
          tag: 'Live Music',
          date: 'Sat, 15 March 2026',
          time: '19:00 – 22:00',
          location: '5 De Beer St, Braamfontein',
          image: 'Resources/Bongeziwe.webp',
          description: 'An intimate evening with one of South Africa\'s most captivating voices. Bongeziwe Mabandla brings his folk-rooted, soul-stirring sound to 5 De Beer — stories woven from the Eastern Cape, performed close enough to feel every breath. This is the kind of night you don\'t plan for. You just find yourself changed by it.',
          lineup: [
            { name: 'Bongeziwe Mabandla', role: 'Headline' },
            { name: 'Opening Act TBA', role: 'Support' }
          ],
          tickets: [
            { tier: 'General Admission', price: 180, available: true },
            { tier: 'VIP (Front Section)', price: 350, available: true },
            { tier: 'Table for 2', price: 600, available: true }
          ],
          status: 'published',
          featured: true,
          createdAt: ts()
        },
        {
          id: 'chef-jes-march2026',
          title: 'Chef Jes',
          tag: 'Food & Culture',
          date: 'Sun, 16 March 2026',
          time: '12:00 – 16:00',
          location: '5 De Beer St, Braamfontein',
          image: 'Resources/Chef doveton.jpg',
          description: 'Cooking as creative expression. Chef Jes brings bold flavours, warm hospitality, and a full afternoon of culinary storytelling. Expect a curated tasting menu, live cooking demonstrations, and conversations about food as a cultural force. This is not just a meal. It\'s a philosophy on a plate.',
          lineup: [],
          tickets: [
            { tier: 'Tasting Experience', price: 250, available: true },
            { tier: 'Workshop + Tasting', price: 480, available: true }
          ],
          status: 'published',
          featured: true,
          createdAt: ts()
        },
        {
          id: 'vuyo-vive-march2026',
          title: 'Vuyo Vive',
          tag: 'Afro Soul',
          date: 'Fri, 21 March 2026',
          time: '20:00 – 23:00',
          location: '5 De Beer St, Braamfontein',
          image: 'Resources/vuyo viwe.jpg',
          description: 'Pure afro-soul energy. Vuyo Vive delivers rhythm, melody, and spirit colliding in real time. A night of pure connection where the music does not just fill the room — it fills you. Come ready to move, to feel, to lose track of everything except the present moment.',
          lineup: [
            { name: 'Vuyo Vive', role: 'Headline' },
            { name: 'DJ Set – Warm Up', role: 'Opening' }
          ],
          tickets: [
            { tier: 'General Admission', price: 150, available: true },
            { tier: 'VIP', price: 300, available: true }
          ],
          status: 'published',
          featured: true,
          createdAt: ts()
        },
        {
          id: 'words-of-azia-march2026',
          title: 'Words of Azia',
          tag: 'Poetry & Spoken Word',
          date: 'Sat, 22 March 2026',
          time: '18:00 – 21:00',
          location: '5 De Beer St, Braamfontein',
          image: 'Resources/words of azia.jpg',
          description: 'Verses that sting, heal, challenge, and elevate. Words of Azia brings spoken word poetry as rebellion and medicine to the &FRIENDS stage. Raw, honest, and unforgettable — this is an evening for those who believe language can shift something fundamental inside you.',
          lineup: [
            { name: 'Words of Azia', role: 'Headline' },
            { name: 'Open Mic Collective', role: 'Support Poets' }
          ],
          tickets: [
            { tier: 'General Admission', price: 120, available: true },
            { tier: 'Poet\'s Circle (Front Row)', price: 200, available: true }
          ],
          status: 'published',
          featured: false,
          createdAt: ts()
        },
        {
          id: 'nandi-april2026',
          title: 'Nandi',
          tag: 'Afro Jazz',
          date: 'Sat, 5 April 2026',
          time: '19:30 – 22:30',
          location: '5 De Beer St, Braamfontein',
          image: 'Resources/nandi.webp',
          description: 'Afro jazz meeting contemporary soul. Nandi\'s voice carries the weight of tradition and the freedom of improvisation. An evening that bridges heritage and innovation, performed in one of Johannesburg\'s most intimate creative spaces.',
          lineup: [
            { name: 'Nandi', role: 'Headline' },
            { name: 'Full Band', role: 'Live Ensemble' }
          ],
          tickets: [
            { tier: 'General Admission', price: 160, available: true },
            { tier: 'VIP Table (seats 4)', price: 800, available: true }
          ],
          status: 'published',
          featured: false,
          createdAt: ts()
        }
      ]);
    }

    if (!read(K.gallery)) {
      write(K.gallery, [
        {
          id: uid(),
          campaign: 'Yomzansi Exhibition',
          tag: '&Bloom',
          date: 'March 2026',
          cover: 'Resources/yomzansi_4352.jpg',
          images: [
            { id: uid(), src: 'Resources/yomzansi_4352.jpg', caption: 'Opening night' },
            { id: uid(), src: 'Resources/yomzansi_4385.jpg', caption: 'The gallery wall' },
            { id: uid(), src: 'Resources/yomzansi_4458.jpg', caption: 'Artist in residence' },
            { id: uid(), src: 'Resources/yomzansi_4527.jpg', caption: 'Community gathering' },
            { id: uid(), src: 'Resources/yomzansi_4809.jpg', caption: 'Final night' },
          ],
          published: true,
          createdAt: ts()
        },
        {
          id: uid(),
          campaign: 'Community Moments',
          tag: '&Fun',
          date: 'February 2026',
          cover: 'Resources/sa-mamakashakaandfriends-2.jpg',
          images: [
            { id: uid(), src: 'Resources/sa-mamakashakaandfriends-2.jpg', caption: 'Community day' },
            { id: uid(), src: 'Resources/szomx0wpyqx8rpblahdi.webp', caption: 'The corner' },
            { id: uid(), src: 'Resources/wvpw8vannd2pwexpidcz.webp', caption: 'Creative space' },
          ],
          published: true,
          createdAt: ts()
        },
        {
          id: uid(),
          campaign: 'Music Nights',
          tag: '&Music',
          date: 'January 2026',
          cover: 'Resources/yomzansi_4458.jpg',
          images: [
            { id: uid(), src: 'Resources/yomzansi_4458.jpg', caption: 'Live on stage' },
            { id: uid(), src: 'Resources/udtd6048cfaq6tjozwvh.webp', caption: 'Sound check' },
            { id: uid(), src: 'Resources/ylzsubmgvfyd6facu8xy.webp', caption: 'The crowd' },
          ],
          published: true,
          createdAt: ts()
        }
      ]);
    }

    if (!read(K.content)) {
      write(K.content, {
        hero: {
          headline: '&FRIENDS',
          subtext: 'A creative community at 5 De Beer St, Braamfontein.',
          image: 'Resources/kr3aysbgelhgvpxwhy5a.png'
        },
        about: {
          heading: 'The Corner',
          body: 'We are not just a building or a location, but we are part of Johannesburg\'s creative beating heart. Milner Park stood here since 1888. Kitcheners poured drinks. The Great Dane hosted nights that became legend. Creasy Tunes spun records for dreamers. Now &Friends carries that torch forward. Same corner. New energy. But the spirit? That endures.',
          image: 'Resources/szomx0wpyqx8rpblahdi.webp'
        },
        building: {
          heading: 'What We Are Building',
          body: 'The space exists because we believe creativity thrives in spaces where people feel safe to be themselves. Here, an artist meets an entrepreneur. A musician finds a collaborator. A thinker discovers their audience. We didn\'t create a venue. We created a permission slip.',
          image: 'Resources/wvpw8vannd2pwexpidcz.webp'
        },
        talk: {
          heading: '&TALK',
          body: 'Conversations that matter happen here. Panels that challenge. Discussions that heal. The kind of talks where someone says something and your entire trajectory shifts.',
          image: 'Resources/gtcoi7zygmzzzfc4w13u.webp'
        },
        food: {
          heading: '&FOOD',
          body: 'The chef is here cooking up a storm. Bold flavours. Warm hospitality. Food as an extension of creativity.',
          quote: 'Cooking is creative freedom. There\'s nothing better than people enjoying your food and feeling that care on their plate.',
          chef: 'Chef Jes',
          image: 'Resources/Chef doveton.jpg'
        },
        music: {
          heading: '&MUSIC',
          body: 'Sound matters here. Live performances that move you. Artists brave enough to bare their souls. Rhythms that connect strangers and turn them into collaborators.',
          image: 'Resources/yomzansi_4458.jpg'
        },
        moments: {
          heading: '&MOMENTS',
          body: 'Our walls breathe with vision. Paintings that command attention. Photography that whispers. Every artist here is brave enough to share their truth.',
        },
        community: {
          heading: '&FRIENDS COMMUNITY',
          body: 'Workshops where you discover skills you didn\'t know lived inside you. Game nights where strangers become friends. Dance parties where everyone belongs.',
          image: 'Resources/sa-mamakashakaandfriends-2.jpg'
        },
        services: {
          heading: 'Host Your Vision',
          body: 'Looking for a venue? We\'re looking for your vision. Think of us as your creative partner, not just a rental. We host exhibitions, performances, masterclasses, panels, celebrations — anything that brings people together with purpose.',
          image1: 'Resources/rl5mq3ehahgcufivmlwk.webp',
          image2: 'Resources/oxrq7axkuxdshtymdkrx.webp'
        },
        contact: {
          phone: '+27 ·········',
          email: 'friends@work.bc.za',
          address: '5 De Beer St, Braamfontein, Johannesburg'
        }
      });
    }

    if (!read(K.tickets)) write(K.tickets, []);
  }

  // ─── AUTH ────────────────────────────────────────────────────────
  const Auth = {
    getSession() { return read(K.session); },

    login(email, password) {
      const users = read(K.users) || [];
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) return { ok: false, error: 'Invalid email or password.' };
      const session = { id: user.id, name: user.name, email: user.email, role: user.role };
      write(K.session, session);
      return { ok: true, user: session };
    },

    register(data) {
      const users = read(K.users) || [];
      if (users.find(u => u.email === data.email)) return { ok: false, error: 'An account with this email already exists.' };
      const ADMIN_CODE = 'ANDFRIENDS2026';
      if (data.role === 'admin' && data.adminCode !== ADMIN_CODE) return { ok: false, error: 'Invalid admin access code.' };
      const newUser = {
        id: uid(),
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || '',
        dob: data.dob || '',
        role: data.role || 'resident',
        createdAt: ts()
      };
      users.push(newUser);
      write(K.users, users);
      const session = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
      write(K.session, session);
      return { ok: true, user: session };
    },

    logout() { localStorage.removeItem(K.session); },

    isLoggedIn() { return !!read(K.session); },

    isAdmin() { const s = read(K.session); return s && s.role === 'admin'; },

    isResident() { const s = read(K.session); return s && s.role === 'resident'; },

    requireAdmin() {
      if (!this.isAdmin()) { window.location.href = rootPath() + 'index.html'; return false; }
      return true;
    },

    requireResident() {
      if (!this.isLoggedIn()) { window.location.href = rootPath() + 'index.html'; return false; }
      return true;
    }
  };

  // ─── EVENTS ──────────────────────────────────────────────────────
  const Events = {
    getAll()           { return read(K.events) || []; },
    getPublished()     { return this.getAll().filter(e => e.status === 'published'); },
    getFeatured()      { return this.getPublished().filter(e => e.featured); },
    getById(id)        { return this.getAll().find(e => e.id === id) || null; },

    create(data) {
      const events = this.getAll();
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      const event = { id: slug, ...data, status: data.status || 'draft', createdAt: ts() };
      events.push(event);
      write(K.events, events);
      return event;
    },

    update(id, data) {
      const events = this.getAll();
      const idx = events.findIndex(e => e.id === id);
      if (idx === -1) return null;
      events[idx] = { ...events[idx], ...data, updatedAt: ts() };
      write(K.events, events);
      return events[idx];
    },

    delete(id) {
      const events = this.getAll().filter(e => e.id !== id);
      write(K.events, events);
    }
  };

  // ─── TICKETS ─────────────────────────────────────────────────────
  const Tickets = {
    getAll()          { return read(K.tickets) || []; },
    getByUser(userId) { return this.getAll().filter(t => t.userId === userId); },
    getById(id)       { return this.getAll().find(t => t.id === id) || null; },

    purchase(eventId, tier, quantity, user) {
      const event = Events.getById(eventId);
      if (!event) return { ok: false, error: 'Event not found.' };
      const tierData = event.tickets.find(t => t.tier === tier);
      if (!tierData || !tierData.available) return { ok: false, error: 'Selected ticket tier unavailable.' };
      const ticket = {
        id: 'TKT-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        eventId,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        eventImage: event.image,
        tag: event.tag,
        tier,
        price: tierData.price,
        quantity,
        total: tierData.price * quantity,
        purchasedAt: ts(),
        validated: false
      };
      const tickets = this.getAll();
      tickets.push(ticket);
      write(K.tickets, tickets);
      return { ok: true, ticket };
    },

    validate(ticketId) {
      const tickets = this.getAll();
      const idx = tickets.findIndex(t => t.id === ticketId);
      if (idx === -1) return { ok: false, error: 'Ticket not found.' };
      if (tickets[idx].validated) return { ok: false, error: 'Ticket already used.' };
      tickets[idx].validated = true;
      tickets[idx].validatedAt = ts();
      write(K.tickets, tickets);
      return { ok: true, ticket: tickets[idx] };
    }
  };

  // ─── GALLERY ─────────────────────────────────────────────────────
  const Gallery = {
    getAll()        { return read(K.gallery) || []; },
    getPublished()  { return this.getAll().filter(g => g.published); },
    getById(id)     { return this.getAll().find(g => g.id === id) || null; },

    createCampaign(data) {
      const gallery = this.getAll();
      const campaign = { id: uid(), ...data, images: [], published: false, createdAt: ts() };
      gallery.push(campaign);
      write(K.gallery, gallery);
      return campaign;
    },

    updateCampaign(id, data) {
      const gallery = this.getAll();
      const idx = gallery.findIndex(g => g.id === id);
      if (idx === -1) return null;
      gallery[idx] = { ...gallery[idx], ...data, updatedAt: ts() };
      write(K.gallery, gallery);
      return gallery[idx];
    },

    addImage(campaignId, imageData) {
      const gallery = this.getAll();
      const idx = gallery.findIndex(g => g.id === campaignId);
      if (idx === -1) return null;
      const img = { id: uid(), ...imageData, addedAt: ts() };
      gallery[idx].images.push(img);
      write(K.gallery, gallery);
      return img;
    },

    deleteImage(campaignId, imageId) {
      const gallery = this.getAll();
      const idx = gallery.findIndex(g => g.id === campaignId);
      if (idx === -1) return;
      gallery[idx].images = gallery[idx].images.filter(i => i.id !== imageId);
      write(K.gallery, gallery);
    },

    deleteCampaign(id) {
      write(K.gallery, this.getAll().filter(g => g.id !== id));
    }
  };

  // ─── CONTENT ─────────────────────────────────────────────────────
  const Content = {
    get()           { return read(K.content); },
    getSection(key) { const c = this.get(); return c ? c[key] : null; },

    updateSection(key, data) {
      const content = this.get() || {};
      content[key] = { ...content[key], ...data };
      write(K.content, content);
      return content[key];
    }
  };

  // ─── USERS (admin) ───────────────────────────────────────────────
  const Users = {
    getAll()    { return (read(K.users) || []).map(u => ({ ...u, password: '••••••••' })); },
    getById(id) { return this.getAll().find(u => u.id === id) || null; },

    updateRole(id, role) {
      const users = read(K.users) || [];
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) return null;
      users[idx].role = role;
      write(K.users, users);
      return users[idx];
    },

    delete(id) {
      write(K.users, (read(K.users) || []).filter(u => u.id !== id));
    },

    updateProfile(id, data) {
      const users = read(K.users) || [];
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) return null;
      const allowed = ['name', 'phone', 'dob'];
      allowed.forEach(k => { if (data[k] !== undefined) users[idx][k] = data[k]; });
      if (data.password) users[idx].password = data.password;
      write(K.users, users);
      const s = read(K.session);
      if (s && s.id === id) { s.name = users[idx].name; write(K.session, s); }
      return users[idx];
    }
  };

  // ─── Utility ─────────────────────────────────────────────────────
  function rootPath() {
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    // If inside /admin/ or /resident/ we need ../
    if (window.location.pathname.includes('/admin/') || window.location.pathname.includes('/resident/')) return '../';
    return '';
  }

  // ─── Init ────────────────────────────────────────────────────────
  seed();

  return { Auth, Events, Tickets, Gallery, Content, Users, uid, ts, rootPath };

})();