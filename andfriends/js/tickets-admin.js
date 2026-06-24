/**
 * &FRIENDS — js/tickets-admin.js
 */

document.getElementById('sidebarMount').outerHTML =
  renderAdminSidebar('tickets.html');

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    Store.Tickets.fetchAll(),
    Store.Events.fetchAll(),
  ]);

  populateEventFilter();
  renderStats();
  renderTickets();

  // live search hooks (optional but useful)
  document.getElementById('ticketSearch')
    ?.addEventListener('input', renderTickets);

  document.getElementById('ticketEventFilter')
    ?.addEventListener('change', renderTickets);
});


// ─────────────────────────────────────────────
// 📊 STATS
// ─────────────────────────────────────────────
function renderStats() {
  const tickets = Store.Tickets.getAll();

  const revenue = tickets.reduce((sum, t) => sum + (t.total || 0), 0);
  const validated = tickets.filter(t => t.validated).length;
  const pending = tickets.length - validated;

  document.getElementById('ticketStats').innerHTML = [
    { icon: '🎟', value: tickets.length, label: 'Total Sold' },
    { icon: '✅', value: validated, label: 'Validated' },
    { icon: '⏳', value: pending, label: 'Pending' },
    { icon: '💰', value: 'R' + revenue.toLocaleString(), label: 'Revenue', accent: true },
  ].map(s => `
    <div class="stat-card ${s.accent ? 'accent' : ''}">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');
}


// ─────────────────────────────────────────────
// 🔽 EVENT FILTER DROPDOWN
// ─────────────────────────────────────────────
function populateEventFilter() {
  const sel = document.getElementById('ticketEventFilter');
  if (!sel) return;

  const events = [...new Set(Store.Tickets.getAll().map(t => t.eventTitle))];

  events.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e;
    opt.textContent = e;
    sel.appendChild(opt);
  });
}


// ─────────────────────────────────────────────
// 📋 TABLE RENDER
// ─────────────────────────────────────────────
function renderTickets() {
  const search = document.getElementById('ticketSearch')?.value?.toLowerCase() || '';
  const eventFilter = document.getElementById('ticketEventFilter')?.value || 'all';

  let tickets = [...Store.Tickets.getAll()].reverse();

  if (eventFilter !== 'all') {
    tickets = tickets.filter(t => t.eventTitle === eventFilter);
  }

  if (search) {
    tickets = tickets.filter(t =>
      t.id.toLowerCase().includes(search) ||
      t.userName.toLowerCase().includes(search) ||
      t.userEmail.toLowerCase().includes(search) ||
      t.eventTitle.toLowerCase().includes(search)
    );
  }

  const wrap = document.getElementById('ticketsTableWrap');

  if (!tickets.length) {
    wrap.innerHTML = `
      <div class="admin-empty">
        <div class="admin-empty-icon">🎟</div>
        <h3>No tickets found</h3>
      </div>`;
    return;
  }

  wrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Ticket ID</th>
          <th>Buyer</th>
          <th>Event</th>
          <th>Tier</th>
          <th>Qty</th>
          <th>Total</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        ${tickets.map(t => `
          <tr>
            <td style="font-family:monospace;font-size:12px;">
              ${t.id}
            </td>

            <td>
              <strong>${t.userName}</strong><br>
              <small style="color:var(--admin-muted)">
                ${t.userEmail}
              </small>
            </td>

            <td style="font-size:13px;">
              ${t.eventTitle}<br>
              <small style="color:var(--admin-muted)">
                ${t.eventDate || ''}
              </small>
            </td>

            <td>${t.tier}</td>
            <td>${t.quantity}</td>

            <td>
              <strong>R${(t.total || 0).toLocaleString()}</strong>
            </td>

            <td>
              <span class="badge ${
                t.validated ? 'badge-validated' : 'badge-pending'
              }">
                ${t.validated ? 'Used' : 'Pending'}
              </span>
            </td>

            <td>
              ${
                !t.validated
                  ? `<button class="btn-secondary btn-sm"
                      onclick="quickValidate('${t.id}')">
                      Validate
                     </button>`
                  : `<span style="font-size:12px;color:var(--admin-muted);">
                      ${t.validatedAt
                        ? new Date(t.validatedAt).toLocaleDateString()
                        : '—'}
                     </span>`
              }
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


// ─────────────────────────────────────────────
// ⚡ QUICK VALIDATION
// ─────────────────────────────────────────────
async function quickValidate(id) {
  const res = await Store.Tickets.validate(id);

  if (res?.ok) {
    showToast(`Ticket ${id} validated ✓`, 'success');
    renderTickets();
    renderStats();
  } else {
    showToast(res?.error || 'Validation failed', 'error');
  }
}


// ─────────────────────────────────────────────
// 🔍 MANUAL VALIDATION INPUT
// ─────────────────────────────────────────────
async function validateTicket() {
  const input = document.getElementById('validateInput');
  const result = document.getElementById('validateResult');

  const id = input?.value?.trim().toUpperCase();
  if (!id) {
    result.innerHTML = `
      <div style="color:var(--danger);font-size:14px;">
        Please enter a ticket ID.
      </div>`;
    return;
  }

  const ticket = Store.Tickets.getById(id);

  if (!ticket) {
    result.innerHTML = `
      <div style="background:var(--danger-bg);padding:14px;border-radius:10px;">
        ❌ Ticket not found
      </div>`;
    return;
  }

  if (ticket.validated) {
    result.innerHTML = `
      <div style="background:var(--warning-bg);padding:14px;border-radius:10px;">
        ⚠️ Already used<br>
        <small>Validated on ${
          new Date(ticket.validatedAt).toLocaleString()
        }</small>
      </div>`;
    return;
  }

  const res = await Store.Tickets.validate(id);

  if (res?.ok) {
    result.innerHTML = `
      <div style="background:var(--success-bg);padding:14px;border-radius:10px;">
        ✅ Valid ticket<br>
        Holder: <strong>${ticket.userName}</strong><br>
        Event: ${ticket.eventTitle}<br>
        Tier: ${ticket.tier}
      </div>`;
    renderTickets();
    renderStats();
  } else {
    result.innerHTML = `
      <div style="color:var(--danger);">
        Validation failed
      </div>`;
  }
}