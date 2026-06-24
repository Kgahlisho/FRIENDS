/**
 * &FRIENDS — js/events-admin.js
 */

document.getElementById('sidebarMount').outerHTML = renderAdminSidebar('events.html');

// ── State ─────────────────────────────────────────────────────────
let editingEventId = null;
let evImageURL     = null;   // ALWAYS a plain string URL (Firebase or base64)
let evPendingFile  = null;   // File waiting to upload on Save
let currentFilter  = 'all';
let isLoadingRetry = false;

// ── Helper: Escape HTML and sanitize data ─────────────────────────
function escapeHtml(str) {
    if (!str) return '';
    // Convert to string in case it's not a string
    str = String(str);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeEventData(event) {
    if (!event) return event;
    
    // Ensure image is a string
    if (event.image && typeof event.image !== 'string') {
        console.warn('Event image is not a string:', event.id, event.image);
        event.image = '';
    }
    
    // Ensure other fields are strings
    const stringFields = ['title', 'tag', 'date', 'time', 'location', 'description', 'status'];
    stringFields.forEach(field => {
        if (event[field] && typeof event[field] !== 'string') {
            event[field] = String(event[field]);
        }
    });
    
    return event;
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Dispatch loading event
    document.dispatchEvent(new CustomEvent('af:eventsLoadStart'));
    
    // Show loading state while fetching
    const wrap = document.getElementById('eventsTableWrap');
    if (wrap) wrap.innerHTML = '<div style="padding:40px;text-align:center;opacity:.5;">Loading events…</div>';

    // Wait for Firebase Auth to resolve before hitting Firestore
    // (Firestore reads may be denied if no auth token is present yet)
    try {
        await Store.Auth.waitForAuth();
    } catch (err) {
        console.warn('Auth wait failed:', err);
    }

    try {
        // Add timeout to prevent infinite loading
        const fetchPromise = Promise.all([
            Store.Events.fetchAll(),
            Store.Tickets.fetchAll(),
        ]);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Loading timeout after 15 seconds')), 15000);
        });
        
        await Promise.race([fetchPromise, timeoutPromise]);
        
        // Sanitize all events after loading
        const events = Store.Events.getAll();
        events.forEach(event => sanitizeEventData(event));
        
        // Dispatch success event
        document.dispatchEvent(new CustomEvent('af:eventsLoaded'));
        renderTable();
        
    } catch (err) {
        console.error('Events admin init error:', err);
        
        // Dispatch error event with details
        document.dispatchEvent(new CustomEvent('af:eventsError', { 
            detail: { 
                error: err.message || 'Failed to load events. Check your connection and Firestore rules.' 
            }
        }));
        
        if (wrap && !isLoadingRetry) {
            wrap.innerHTML = `
                <div style="padding:40px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                    <h3 style="margin-bottom:8px;">Failed to load events</h3>
                    <p style="color:var(--admin-muted);margin-bottom:24px;">${escapeHtml(err.message || 'Check your connection and Firestore rules.')}</p>
                    <button class="btn-primary" onclick="retryLoadEvents()">Retry</button>
                </div>`;
        }
    }
});

// Re-render whenever Firestore data updates (e.g. after a save or external change)
document.addEventListener('af:events', () => renderTable());

// ── Retry function ────────────────────────────────────────────────
window.retryLoadEvents = async function() {
    isLoadingRetry = true;
    const wrap = document.getElementById('eventsTableWrap');
    
    if (wrap) {
        wrap.innerHTML = '<div style="padding:40px;text-align:center;opacity:.5;">Retrying…</div>';
    }
    
    try {
        await Store.Auth.waitForAuth();
        
        const fetchPromise = Promise.all([
            Store.Events.fetchAll(),
            Store.Tickets.fetchAll(),
        ]);
        
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Loading timeout')), 15000);
        });
        
        await Promise.race([fetchPromise, timeoutPromise]);
        
        // Sanitize events after loading
        const events = Store.Events.getAll();
        events.forEach(event => sanitizeEventData(event));
        
        document.dispatchEvent(new CustomEvent('af:eventsLoaded'));
        renderTable();
        showToast('Events loaded successfully', 'success');
        
    } catch (err) {
        console.error('Retry failed:', err);
        document.dispatchEvent(new CustomEvent('af:eventsError', { 
            detail: { error: err.message }
        }));
        
        if (wrap) {
            wrap.innerHTML = `
                <div style="padding:40px;text-align:center;">
                    <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
                    <h3 style="margin-bottom:8px;">Still having trouble</h3>
                    <p style="color:var(--admin-muted);margin-bottom:24px;">${escapeHtml(err.message || 'Please check your internet connection and refresh the page.')}</p>
                    <button class="btn-primary" onclick="location.reload()">Refresh Page</button>
                </div>`;
        }
    } finally {
        isLoadingRetry = false;
    }
};

// ── Table ─────────────────────────────────────────────────────────
function renderTable() {
    let events = Store.Events.getAll();
    if (currentFilter !== 'all') events = events.filter(e => e.status === currentFilter);
    events = [...events].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const wrap = document.getElementById('eventsTableWrap');
    if (!wrap) return;

    if (!events.length) {
        wrap.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">🗓</div>
                <h3>No events yet</h3>
                <p>Create your first event to get started.</p>
                <button class="btn-primary" onclick="openEventModal()">+ New Event</button>
            </div>`;
        return;
    }

    wrap.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Event</th><th>Date</th><th>Tickets</th>
                    <th>Status</th><th>Featured</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${events.map(e => {
                    const sold = Store.Tickets.getAll().filter(t => t.eventId === e.id).length;
                    
                    // SAFELY handle image URL - check if it's a string first
                    let imgSrc = '';
                    if (e.image) {
                        if (typeof e.image === 'string') {
                            imgSrc = (e.image.startsWith('http') || e.image.startsWith('data:'))
                                ? e.image : (e.image ? '../' + e.image : '');
                        } else if (typeof e.image === 'object' && e.image.url) {
                            // Handle case where image is an object with url property
                            imgSrc = e.image.url;
                        }
                    }
                    
                    return `
                        <tr>
                            <td>
                                <div style="display:flex;align-items:center;gap:12px;">
                                    ${imgSrc ? `<img src="${imgSrc}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />` : '<div style="width:44px;height:44px;background:var(--admin-border);border-radius:6px;flex-shrink:0;"></div>'}
                                    <div>
                                        <strong>${escapeHtml(e.title || '')}</strong>
                                        <div style="font-size:12px;color:var(--admin-muted)">${escapeHtml(e.tag || '')}</div>
                                    </div>
                                </div>
                            </div>
                            <td style="font-size:13px;">${escapeHtml(e.date || '')}<br><small style="color:var(--admin-muted)">${escapeHtml(e.time || '')}</small></td>
                            <td>${sold} sold</td>
                            <td><span class="badge badge-${e.status || 'draft'}">${e.status || 'draft'}</span></td>
                            <td>${e.featured ? '★' : '–'}</td>
                            <td>
                                <div style="display:flex;gap:8px;">
                                    <button class="btn-icon" onclick="openEventModal('${e.id}')" title="Edit">✏️</button>
                                    <button class="btn-icon" onclick="toggleStatus('${e.id}')" title="${e.status === 'published' ? 'Unpublish' : 'Publish'}">
                                        ${e.status === 'published' ? '⏸' : '▶'}
                                    </button>
                                    <button class="btn-icon danger" onclick="deleteEvent('${e.id}')" title="Delete">🗑</button>
                                </div>
                            </td>
                        </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}

function filterEvents(f, btn) {
    currentFilter = f;
    
    // Update active button styling
    const buttons = document.querySelectorAll('.admin-topbar-actions .btn-secondary');
    buttons.forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    renderTable();
}

// ── Open modal ────────────────────────────────────────────────────
function openEventModal(id = null) {
    editingEventId = id;
    evImageURL = null;
    evPendingFile = null;
    clearEventForm();

    if (id) {
        const e = Store.Events.getById(id);
        if (!e) {
            showToast('Event not found', 'error');
            return;
        }
        document.getElementById('eventModalTitle').textContent = 'Edit Event';
        document.getElementById('evTitle').value = e.title || '';
        document.getElementById('evTag').value = e.tag || '';
        document.getElementById('evTime').value = e.time || '';
        document.getElementById('evLocation').value = e.location || '';
        document.getElementById('evDescription').value = e.description || '';
        document.getElementById('evStatus').value = e.status || 'draft';
        document.getElementById('evFeatured').checked = !!e.featured;
        if (e.date) {
            try {
                const d = new Date(e.date.replace(/\w+,\s*/, ''));
                if (!isNaN(d)) document.getElementById('evDate').value = d.toISOString().slice(0, 10);
            } catch (_) {}
        }
        // Handle image - ensure it's a string
        if (e.image && typeof e.image === 'string') {
            evImageURL = e.image;
            _showImgPreview(e.image);
        }
        (e.lineup || []).forEach(l => addLineupRow(l.name, l.role));
        (e.tickets || []).forEach(t => addTicketRow(t.tier, t.price, t.available));
    } else {
        document.getElementById('eventModalTitle').textContent = 'New Event';
        addTicketRow('General Admission', 150, true);
    }

    openAdminModal('eventModal');
    _wireEventImageInput();
}

function clearEventForm() {
    ['evTitle','evTime','evLocation','evDescription'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('evDate').value       = '';
    document.getElementById('evTag').value        = 'Live Music';
    document.getElementById('evStatus').value     = 'draft';
    document.getElementById('evFeatured').checked = false;
    document.getElementById('evImgPreview').innerHTML = '';
    document.getElementById('lineupRows').innerHTML   = '';
    document.getElementById('ticketRows').innerHTML   = '';
}

// ── Image input wiring ────────────────────────────────────────────
// The file input sits on TOP of the zone div (position:absolute, inset:0).
// All drag events hit the INPUT, not the zone — so we listen on the INPUT.
function _wireEventImageInput() {
    const zone  = document.getElementById('evImgZone');
    const input = zone ? zone.querySelector('input[type="file"]') : null;
    if (!input || input._wired) return;
    input._wired = true;

    // Drag visual feedback on the ZONE via events that bubble from INPUT
    input.addEventListener('dragenter', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    input.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    input.addEventListener('dragleave', e => { e.preventDefault(); zone.classList.remove('drag-over'); });

    // DROP on the input — manually read files from dataTransfer
    input.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) _handleEventFile(file);
    });
}

// ── File input onchange (click to browse) ─────────────────────────
function handleEventImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    _handleEventFile(file);
    input.value = '';   // allow re-selecting same file
}

// ── Handle chosen file: show preview, stage for upload ───────────
function _handleEventFile(file) {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showToast('Image must be less than 5MB', 'error');
        return;
    }
    
    // Show instant local preview using object URL
    const localURL = URL.createObjectURL(file);
    evPendingFile  = file;
    evImageURL     = null;   // will be set to real URL after Firebase upload on Save
    _showImgPreview(localURL);
    showToast('Image selected — click "Save Event" to upload and save.', 'info');
}

function _showImgPreview(src) {
    const el = document.getElementById('evImgPreview');
    if (!el) return;
    el.innerHTML = `<img src="${src}" style="height:80px;border-radius:8px;object-fit:cover;max-width:160px;" onerror="this.style.opacity=0.3" /><p style="font-size:11px;color:var(--admin-muted);margin-top:4px;">Preview</p>`;
}

// ── Lineup rows ───────────────────────────────────────────────────
function addLineupRow(name = '', role = '') {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;margin-bottom:8px;';
    row.innerHTML = `
        <input type="text" class="form-input lineup-name" placeholder="Artist name" value="${escapeHtml(name)}" style="flex:1;" />
        <input type="text" class="form-input lineup-role" placeholder="Role" value="${escapeHtml(role)}" style="width:160px;" />
        <button type="button" class="btn-icon danger" onclick="this.parentElement.remove()">✕</button>`;
    document.getElementById('lineupRows').appendChild(row);
}

// ── Ticket tier rows ──────────────────────────────────────────────
function addTicketRow(tier = '', price = 0, available = true) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;margin-bottom:8px;align-items:center;';
    row.innerHTML = `
        <input type="text"   class="form-input ticket-tier-name"  placeholder="Tier name"  value="${escapeHtml(tier)}"        style="flex:1;" />
        <input type="number" class="form-input ticket-tier-price" placeholder="Price (R)"  value="${price || ''}" style="width:120px;" min="0" step="0.01" />
        <label style="font-size:13px;display:flex;gap:6px;align-items:center;white-space:nowrap;cursor:pointer;">
            <input type="checkbox" class="ticket-tier-avail" ${available ? 'checked' : ''} /> Available
        </label>
        <button type="button" class="btn-icon danger" onclick="this.parentElement.remove()">✕</button>`;
    document.getElementById('ticketRows').appendChild(row);
}

// ── Save event ────────────────────────────────────────────────────
// ── Save event ────────────────────────────────────────────────────
// ── Save event ────────────────────────────────────────────────────
// ── Save event ────────────────────────────────────────────────────
async function saveEvent() {
    const title = document.getElementById('evTitle').value.trim();
    const dateRaw = document.getElementById('evDate').value;
    const time = document.getElementById('evTime').value.trim();
    const description = document.getElementById('evDescription').value.trim();

    if (!title || !dateRaw || !time || !description) {
        showToast('Please fill in Title, Date, Time and Description.', 'error');
        return;
    }

    // Disable save button to prevent double-submit
    const saveBtn = document.querySelector('#eventModal .btn-primary[onclick="saveEvent()"]');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';
    }

    try {
        let finalImageURL = evImageURL;

        // Upload image if one was staged
        if (evPendingFile) {
            showToast('Uploading image…', 'info');
            finalImageURL = await Store.Events.uploadImage(evPendingFile, editingEventId || ('temp_' + Date.now()));
            evPendingFile = null;
            if (finalImageURL) {
                _showImgPreview(finalImageURL);
                console.log('Image uploaded:', finalImageURL);
            }
        }

        // Format date
        const d = new Date(dateRaw + 'T12:00:00');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dateStr = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

        const lineup = [...document.querySelectorAll('#lineupRows > div')].map(r => ({
            name: r.querySelector('.lineup-name').value.trim(),
            role: r.querySelector('.lineup-role').value.trim(),
        })).filter(l => l.name);

        const tickets = [...document.querySelectorAll('#ticketRows > div')].map(r => ({
            tier: r.querySelector('.ticket-tier-name').value.trim(),
            price: parseFloat(r.querySelector('.ticket-tier-price').value) || 0,
            available: r.querySelector('.ticket-tier-avail').checked,
        })).filter(t => t.tier);

        const data = {
            title: title,
            tag: document.getElementById('evTag').value,
            date: dateStr,
            time: time,
            location: document.getElementById('evLocation').value.trim() || '5 De Beer St, Braamfontein',
            description: description,
            lineup: lineup,
            tickets: tickets,
            status: document.getElementById('evStatus').value,
            featured: document.getElementById('evFeatured').checked,
        };
        
        // Only add image to data if we have a new one
        if (finalImageURL) {
            data.image = finalImageURL;
        }

        console.log('Saving event data:', data);

        let result;
        if (editingEventId) {
            // For updates, only pass fields that have changed
            // The image will be preserved automatically by the update method
            result = await Store.Events.update(editingEventId, data);
            showToast('Event updated successfully.', 'success');
        } else {
            // For new events, ensure image is included (even if empty)
            data.image = finalImageURL || '';
            result = await Store.Events.create(data);
            showToast('Event created successfully.', 'success');
        }
        
        console.log('Save result:', result);
        
        closeAdminModal('eventModal');
        
        // Refresh the events list
        await Store.Events.fetchAll();
        renderTable();
        
    } catch (err) {
        console.error('saveEvent error:', err);
        showToast('Failed to save event: ' + err.message, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Event';
        }
    }
}
// ── Toggle status ─────────────────────────────────────────────────
// ── Toggle status ─────────────────────────────────────────────────
async function toggleStatus(id) {
    const e = Store.Events.getById(id);
    if (!e) return;
    
    try {
        // Only update the status field, preserve everything else including image
        await Store.Events.update(id, { 
            status: e.status === 'published' ? 'draft' : 'published' 
        });
        showToast(`Event ${e.status === 'published' ? 'unpublished' : 'published'}.`, 'success');
        renderTable();
    } catch (err) {
        showToast('Failed to update status: ' + err.message, 'error');
    }
}

// ── Delete ────────────────────────────────────────────────────────
function deleteEvent(id) {
    const e = Store.Events.getById(id);
    adminConfirm(`Delete "${e?.title}"? This action cannot be undone.`, async () => {
        try {
            await Store.Events.delete(id);
            showToast('Event deleted successfully.', 'info');
            renderTable();
        } catch (err) {
            showToast('Failed to delete event: ' + err.message, 'error');
        }
    });
}