/**
 * &FRIENDS — js/events-admin.js
 */

document.getElementById('sidebarMount').outerHTML = renderAdminSidebar('events.html');

    let editingEventId = null;
    let evImageData = null;
    let currentFilter = 'all';

    document.addEventListener('DOMContentLoaded', renderTable);

    // ── Table ────────────────────────────────────────────────
    function renderTable() {
      let events = Store.Events.getAll();
      if (currentFilter !== 'all') events = events.filter(e => e.status === currentFilter);
      events = events.reverse();

      const wrap = document.getElementById('eventsTableWrap');
      if (!events.length) {
        wrap.innerHTML = `<div class="admin-empty">
          <div class="admin-empty-icon">🗓</div>
          <h3>No events yet</h3>
          <p>Create your first event to get started.</p>
          <button class="btn-primary" onclick="openEventModal()">+ New Event</button>
        </div>`; return;
      }

      wrap.innerHTML = `<table class="admin-table">
        <thead><tr>
          <th>Event</th><th>Date</th><th>Tickets</th><th>Status</th><th>Featured</th><th>Actions</th>
        </tr></thead>
        <tbody>${events.map(e => {
          const sold = Store.Tickets.getAll().filter(t => t.eventId === e.id).length;
          return `<tr>
            <td>
              <div style="display:flex;align-items:center;gap:12px;">
                <img src="${e.image}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.style.display='none'" />
                <div>
                  <strong>${e.title}</strong>
                  <div style="font-size:12px;color:var(--admin-muted)">${e.tag}</div>
                </div>
              </div>
            </td>
            <td style="font-size:13px;">${e.date}<br><small style="color:var(--admin-muted)">${e.time}</small></td>
            <td>${sold} sold</td>
            <td><span class="badge badge-${e.status}">${e.status}</span></td>
            <td>${e.featured ? '★' : '–'}</td>
            <td>
              <div style="display:flex;gap:8px;">
                <button class="btn-icon" onclick="openEventModal('${e.id}')" title="Edit">✏️</button>
                <button class="btn-icon" onclick="toggleStatus('${e.id}')" title="Toggle status">${e.status === 'published' ? '⏸' : '▶'}</button>
                <button class="btn-icon danger" onclick="deleteEvent('${e.id}')" title="Delete">🗑</button>
              </div>
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
    }

    function filterEvents(f, btn) {
      currentFilter = f;
      renderTable();
    }

    // ── Modal open/fill ──────────────────────────────────────
    function openEventModal(id = null) {
      editingEventId = id;
      evImageData = null;
      clearEventForm();

      if (id) {
        const e = Store.Events.getById(id);
        if (!e) return;
        document.getElementById('eventModalTitle').textContent = 'Edit Event';
        document.getElementById('evTitle').value = e.title;
        document.getElementById('evTag').value = e.tag;
        document.getElementById('evDate').value = e.date.replace(/\w+,\s*/, '').split(' ').reverse().join('-').replace(/(\w+)-(\d+)-(\d{4})/, (_, m, d, y) => {
          const months = {January:'01',February:'02',March:'03',April:'04',May:'05',June:'06',July:'07',August:'08',September:'09',October:'10',November:'11',December:'12'};
          return `${y}-${months[m]}-${d.padStart(2,'0')}`;
        });
        document.getElementById('evTime').value = e.time;
        document.getElementById('evLocation').value = e.location;
        document.getElementById('evDescription').value = e.description;
        document.getElementById('evStatus').value = e.status;
        document.getElementById('evFeatured').checked = e.featured;
        if (e.image) {
          evImageData = e.image;
          document.getElementById('evImgPreview').innerHTML = `<img src="${e.image}" style="height:80px;border-radius:8px;object-fit:cover;" />`;
        }
        e.lineup.forEach(l => addLineupRow(l.name, l.role));
        e.tickets.forEach(t => addTicketRow(t.tier, t.price, t.available));
      } else {
        document.getElementById('eventModalTitle').textContent = 'New Event';
        addTicketRow('General Admission', 150, true);
      }

      openAdminModal('eventModal');
    }

    function clearEventForm() {
      ['evTitle','evTime','evLocation','evDescription'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('evDate').value = '';
      document.getElementById('evTag').value = 'Live Music';
      document.getElementById('evStatus').value = 'draft';
      document.getElementById('evFeatured').checked = false;
      document.getElementById('evImgPreview').innerHTML = '';
      document.getElementById('lineupRows').innerHTML = '';
      document.getElementById('ticketRows').innerHTML = '';
    }

    // ── Image upload ─────────────────────────────────────────
    async function handleEventImageUpload(input) {
      const file = input.files[0];
      if (!file) return;
      evImageData = await fileToBase64(file);
      document.getElementById('evImgPreview').innerHTML = `<img src="${evImageData}" style="height:80px;border-radius:8px;object-fit:cover;" />`;
    }

    // ── Lineup rows ──────────────────────────────────────────
    function addLineupRow(name = '', role = '') {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:10px;margin-bottom:8px;';
      row.innerHTML = `
        <input type="text" class="form-input lineup-name" placeholder="Artist / Speaker name" value="${name}" style="flex:1;" />
        <input type="text" class="form-input lineup-role" placeholder="Role (e.g. Headline)" value="${role}" style="width:160px;" />
        <button type="button" class="btn-icon danger" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById('lineupRows').appendChild(row);
    }

    // ── Ticket tier rows ─────────────────────────────────────
    function addTicketRow(tier = '', price = 0, available = true) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:10px;margin-bottom:8px;align-items:center;';
      row.innerHTML = `
        <input type="text" class="form-input ticket-tier-name" placeholder="Tier name" value="${tier}" style="flex:1;" />
        <input type="number" class="form-input ticket-tier-price" placeholder="Price (R)" value="${price || ''}" style="width:120px;" min="0" />
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;white-space:nowrap;cursor:pointer;">
          <input type="checkbox" class="ticket-tier-avail" ${available ? 'checked' : ''} style="accent-color:var(--orange);" /> Available
        </label>
        <button type="button" class="btn-icon danger" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById('ticketRows').appendChild(row);
    }

    // ── Save ─────────────────────────────────────────────────
    function saveEvent() {
      const title = document.getElementById('evTitle').value.trim();
      const dateRaw = document.getElementById('evDate').value;
      const time = document.getElementById('evTime').value.trim();
      const description = document.getElementById('evDescription').value.trim();

      if (!title || !dateRaw || !time || !description) { showToast('Please fill in all required fields.', 'error'); return; }

      // Format date nicely
      const d = new Date(dateRaw + 'T12:00:00');
      const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const dateStr = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

      const lineup = [...document.querySelectorAll('#lineupRows > div')].map(row => ({
        name: row.querySelector('.lineup-name').value.trim(),
        role: row.querySelector('.lineup-role').value.trim()
      })).filter(l => l.name);

      const tickets = [...document.querySelectorAll('#ticketRows > div')].map(row => ({
        tier: row.querySelector('.ticket-tier-name').value.trim(),
        price: parseFloat(row.querySelector('.ticket-tier-price').value) || 0,
        available: row.querySelector('.ticket-tier-avail').checked
      })).filter(t => t.tier);

      const data = {
        title,
        tag: document.getElementById('evTag').value,
        date: dateStr,
        time,
        location: document.getElementById('evLocation').value.trim() || '5 De Beer St, Braamfontein',
        description,
        image: evImageData || (editingEventId ? Store.Events.getById(editingEventId)?.image : 'Resources/kr3aysbgelhgvpxwhy5a.webp'),
        lineup,
        tickets,
        status: document.getElementById('evStatus').value,
        featured: document.getElementById('evFeatured').checked,
      };

      if (editingEventId) {
        Store.Events.update(editingEventId, data);
        showToast('Event updated successfully.');
      } else {
        Store.Events.create(data);
        showToast('Event created successfully.');
      }

      closeAdminModal('eventModal');
      renderTable();
    }

    function toggleStatus(id) {
      const e = Store.Events.getById(id);
      if (!e) return;
      Store.Events.update(id, { status: e.status === 'published' ? 'draft' : 'published' });
      showToast(`Event ${e.status === 'published' ? 'unpublished' : 'published'}.`);
      renderTable();
    }

    function deleteEvent(id) {
      const e = Store.Events.getById(id);
      adminConfirm(`Delete "${e?.title}"?`, () => {
        Store.Events.delete(id);
        showToast('Event deleted.', 'info');
        renderTable();
      });
    }