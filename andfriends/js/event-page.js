/**
 * &FRIENDS — event-page.js
 * Event detail page. All data from Store.Events.
 */

let currentEvent = null;
let selectedTier = null;
let qty = 1;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = 'play.html'; return; }

  currentEvent = Store.Events.getById(id);
  if (!currentEvent || currentEvent.status !== 'published') { window.location.href = 'play.html'; return; }

  document.title = `&FRIENDS — ${currentEvent.title}`;
  renderPage();
  loadFooterContent();
});

function loadFooterContent() {
  const contact = Store.Content.getSection('contact');
  if (!contact) return;
  const ph = document.getElementById('footerPhone');
  const em = document.getElementById('footerEmail');
  if (ph) ph.textContent = 'Call Us: ' + contact.phone;
  if (em) { em.textContent = 'Email Us: ' + contact.email; em.href = 'mailto:' + contact.email; }
}

function renderPage() {
  const e = currentEvent;
  selectedTier = e.tickets[0];

  const lineupHTML = e.lineup && e.lineup.length
    ? `<div class="event-desc-block">
        <h2 class="event-section-heading">Lineup</h2>
        <div class="event-lineup">
          ${e.lineup.map(p => `
            <div class="lineup-item">
              <span class="lineup-name">${p.name}</span>
              <span class="lineup-role">${p.role}</span>
            </div>`).join('')}
        </div>
      </div>` : '';

  const tiersHTML = e.tickets.map((t, i) => `
    <div class="ticket-tier ${i === 0 ? 'selected' : ''} ${!t.available ? 'sold-out' : ''}"
         data-index="${i}" data-price="${t.price}"
         onclick="${t.available ? `selectTier(this,${i})` : ''}">
      <div class="tier-info">
        <span class="tier-name">${t.tier}</span>
        ${!t.available ? '<span class="tier-sold">Sold Out</span>' : ''}
      </div>
      <span class="tier-price">R${t.price.toLocaleString()}</span>
    </div>`).join('');

  const session = Store.Auth.getSession();
  const authGateHTML = session ? '' : `
    <div class="auth-gate">
      <p>Sign in to purchase tickets</p>
      <div class="auth-gate-buttons">
        <button class="btn-gate-login" onclick="openAuthModal('login')">Log In</button>
        <button class="btn-gate-register" onclick="openAuthModal('register')">Sign Up</button>
      </div>
    </div>`;

  const purchaseBtnHTML = session ? `<button class="btn-purchase" id="btnPurchase" onclick="handlePurchase()">Get Tickets →</button>` : '';

  document.getElementById('eventPageRoot').innerHTML = `
    <section class="event-hero">
      <div class="event-hero-img-wrap">
        <img src="../${e.image}" alt="${e.title}" class="event-hero-img" />
        <div class="event-hero-overlay"></div>
      </div>
      <div class="event-hero-content">
        <span class="event-hero-tag">${e.tag}</span>
        <h1 class="event-hero-title">${e.title}</h1>
        <div class="event-hero-meta">
          <span class="event-meta-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${e.date}
          </span>
          <span class="event-meta-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${e.time}
          </span>
          <span class="event-meta-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${e.location}
          </span>
        </div>
      </div>
    </section>

    <main class="event-main">
      <div class="event-body">
        <div class="event-desc-block">
          <h2 class="event-section-heading">About This Event</h2>
          <p class="event-description">${e.description}</p>
        </div>
        ${lineupHTML}
        <div class="event-info-grid">
          <div class="event-info-card"><div class="info-icon">📍</div><div><strong>Venue</strong><p>${e.location}</p></div></div>
          <div class="event-info-card"><div class="info-icon">🎟</div><div><strong>Ticket Policy</strong><p>Non-refundable. QR code required for entry.</p></div></div>
          <div class="event-info-card"><div class="info-icon">🕐</div><div><strong>Doors Open</strong><p>30 minutes before showtime</p></div></div>
          <div class="event-info-card"><div class="info-icon">🪪</div><div><strong>Age</strong><p>18+ Event. Valid ID required.</p></div></div>
        </div>
      </div>

      <aside class="event-ticket-panel">
        <div class="ticket-panel-inner">
          <div class="ticket-panel-header">
            <span class="ticket-panel-label">Secure Your Spot</span>
            <div class="ticket-availability">
              <span class="availability-dot"></span>
              <span>Tickets Available</span>
            </div>
          </div>
          <div class="ticket-tiers" id="ticketTiers">${tiersHTML}</div>
          <div class="ticket-qty-row">
            <label class="ticket-qty-label">Quantity</label>
            <div class="qty-control">
              <button class="qty-btn" onclick="changeQty(-1)">−</button>
              <span class="qty-value" id="qtyDisplay">1</span>
              <button class="qty-btn" onclick="changeQty(1)">+</button>
            </div>
          </div>
          <div class="ticket-total-row">
            <span>Total</span>
            <span class="ticket-total-price" id="totalDisplay">R${e.tickets[0].price.toLocaleString()}</span>
          </div>
          ${authGateHTML}
          ${purchaseBtnHTML}
          <p class="ticket-notice">Secure checkout · &FRIENDS Ticketing</p>
        </div>
      </aside>
    </main>

    <!-- TICKET MODAL -->
    <div class="modal-backdrop" id="ticketModal" style="display:none;">
      <div class="ticket-modal">
        <button class="ticket-modal-close" onclick="document.getElementById('ticketModal').style.display='none'">✕</button>
        <div class="ticket-modal-header">
          <span class="ticket-modal-brand">&amp;FRIENDS</span>
          <span class="ticket-modal-tag" id="tModalTag"></span>
        </div>
        <div class="ticket-modal-body">
          <h2 class="ticket-modal-title" id="tModalTitle"></h2>
          <p class="ticket-modal-meta" id="tModalMeta"></p>
          <div class="ticket-perf-line">
            <span class="perf-hole left"></span>
            <div class="perf-dashes"></div>
            <span class="perf-hole right"></span>
          </div>
          <div class="ticket-qr-wrap">
            <div id="ticketQR"></div>
            <p class="ticket-qr-label">Scan at entrance</p>
          </div>
          <div class="ticket-details-list" id="tModalDetails"></div>
        </div>
        <div class="ticket-modal-footer">
          <button class="btn-ticket-action" onclick="viewMyTickets()">View My Tickets →</button>
        </div>
      </div>
    </div>`;
}

// ── Ticket tier selection ────────────────────────────────────────
function selectTier(el, idx) {
  if (el.classList.contains('sold-out')) return;
  document.querySelectorAll('.ticket-tier').forEach(t => t.classList.remove('selected'));
  el.classList.add('selected');
  selectedTier = currentEvent.tickets[idx];
  updateTotal();
}

function changeQty(delta) {
  qty = Math.max(1, Math.min(8, qty + delta));
  document.getElementById('qtyDisplay').textContent = qty;
  updateTotal();
}

function updateTotal() {
  if (!selectedTier) return;
  document.getElementById('totalDisplay').textContent = 'R' + (selectedTier.price * qty).toLocaleString();
}

// ── Purchase ─────────────────────────────────────────────────────
function handlePurchase() {
  const session = Store.Auth.getSession();
  if (!session) { openAuthModal('login'); return; }
  if (!selectedTier || !selectedTier.available) { alert('Please select an available ticket tier.'); return; }

  const result = Store.Tickets.purchase(currentEvent.id, selectedTier.tier, qty, session);
  if (!result.ok) { alert(result.error); return; }

  showTicketModal(result.ticket);
}

function showTicketModal(ticket) {
  document.getElementById('tModalTag').textContent = ticket.tag;
  document.getElementById('tModalTitle').textContent = ticket.eventTitle;
  document.getElementById('tModalMeta').textContent = ticket.eventDate + ' · ' + ticket.eventLocation;

  document.getElementById('tModalDetails').innerHTML = [
    ['Ticket Holder', ticket.userName],
    ['Ticket Type', ticket.tier],
    ['Quantity', ticket.quantity],
    ['Total Paid', 'R' + ticket.total.toLocaleString()],
    ['Ticket ID', ticket.id],
  ].map(([l, v]) => `
    <div class="ticket-detail-row">
      <span>${l}</span><strong>${v}</strong>
    </div>`).join('');

  const qrEl = document.getElementById('ticketQR');
  qrEl.innerHTML = '';
  new QRCode(qrEl, {
    text: JSON.stringify({ id: ticket.id, event: ticket.eventId, user: ticket.userId }),
    width: 160, height: 160,
    colorDark: '#2c1a0e', colorLight: '#fdf6f2',
    correctLevel: QRCode.CorrectLevel.H
  });

  document.getElementById('ticketModal').style.display = 'flex';
}

function viewMyTickets() {
  window.location.href = '../user_tickets.html';
}