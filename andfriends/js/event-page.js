/**
 * &FRIENDS — event-page.js
 * Single event detail + ticket purchase (event.html).
 *
 * Layout: LEFT = full event image | RIGHT = all details + ticket panel
 */

let currentEvent = null;
let selectedTier = null;
let qty = 1;

document.addEventListener('DOMContentLoaded', async () => {

    const params = new URLSearchParams(window.location.search);
    const id     = params.get('id');

    if (!id) { window.location.href = 'play.html'; return; }

    try { await Store.Events.fetchPublished(); }
    catch (e) { console.error('event-page: fetch failed', e); }

    currentEvent = Store.Events.getById(id);

    if (!currentEvent || currentEvent.status !== 'published') {
        window.location.href = 'play.html';
        return;
    }

    try { await Store.Content.fetch(); } catch (_) {}

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
    selectedTier = (e.tickets || [])[0] || null;

    const imgSrc = src =>
        (!src || src.startsWith('http') || src.startsWith('data:')) ? (src || '') : '../' + src;

    const lineupHTML = e.lineup && e.lineup.length
        ? `<div class="ev-section">
            <h2 class="ev-heading">Lineup</h2>
            <div class="ev-lineup">
              ${e.lineup.map(p => `
                <div class="ev-lineup-item">
                  <span class="ev-lineup-name">${escapeHtml(p.name)}</span>
                  <span class="ev-lineup-role">${escapeHtml(p.role)}</span>
                </div>`).join('')}
            </div>
          </div>` : '';

    const tiersHTML = (e.tickets || []).map((t, i) => `
      <div class="ticket-tier ${i === 0 ? 'selected' : ''} ${!t.available ? 'sold-out' : ''}"
           data-index="${i}" data-price="${t.price}"
           onclick="${t.available ? `selectTier(this,${i})` : ''}">
        <div class="tier-info">
          <span class="tier-name">${escapeHtml(t.tier)}</span>
          ${!t.available ? '<span class="tier-sold">Sold Out</span>' : ''}
        </div>
        <span class="tier-price">R${t.price.toLocaleString()}</span>
      </div>`).join('');

    const session = Store.Auth.getSession();

    const authGateHTML = session ? '' : `
      <div class="auth-gate">
        <h3 class="auth-gate-title">Members Access Required</h3>
        <p class="auth-gate-text">Log in or create an account to secure your tickets.</p>
        <div class="auth-gate-buttons">
          <button class="btn-gate-login"    onclick="openAuthModal('login')">Log In</button>
          <button class="btn-gate-register" onclick="openAuthModal('register')">Create Account</button>
        </div>
      </div>`;

    const purchaseBtnHTML = session
        ? `<button class="btn-purchase" id="btnPurchase" onclick="openConfirmationModal()">Get Tickets →</button>`
        : '';

    const firstPrice = (e.tickets || [])[0]?.price || 0;

    document.getElementById('eventPageRoot').innerHTML = `

      <!-- ═══ TWO-COLUMN SPLIT ═══════════════════════════════ -->
      <div class="ev-split">

        <!-- LEFT: Event image -->
        <div class="ev-split-img">
          <img src="${imgSrc(e.image)}" alt="${escapeHtml(e.title)}" class="ev-img" />
          <span class="ev-img-tag">${escapeHtml(e.tag)}</span>
        </div>

        <!-- RIGHT: Everything else -->
        <div class="ev-split-right">

          <!-- Event title + meta -->
          <div class="ev-title-block">
            <h1 class="ev-title">${escapeHtml(e.title)}</h1>
            <div class="ev-meta">
              <span class="ev-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                ${e.date}
              </span>
              <span class="ev-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                ${e.time}
              </span>
              <span class="ev-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                ${escapeHtml(e.location)}
              </span>
            </div>
          </div>

          <!-- About -->
          <div class="ev-section">
            <h2 class="ev-heading">About This Event</h2>
            <p class="ev-description">${escapeHtml(e.description)}</p>
          </div>

          <!-- Lineup -->
          ${lineupHTML}

          <!-- Info cards -->
          <div class="ev-info-grid">
            <div class="ev-info-card">
              <span class="ev-info-icon">📍</span>
              <div><strong>Venue</strong><p>${escapeHtml(e.location)}</p></div>
            </div>
            <div class="ev-info-card">
              <span class="ev-info-icon">🎟</span>
              <div><strong>Ticket Policy</strong><p>Non-refundable. QR code required for entry.</p></div>
            </div>
            <div class="ev-info-card">
              <span class="ev-info-icon">🕐</span>
              <div><strong>Doors Open</strong><p>30 minutes before showtime</p></div>
            </div>
            <div class="ev-info-card">
              <span class="ev-info-icon">🪪</span>
              <div><strong>Age</strong><p>18+ Event. Valid ID required.</p></div>
            </div>
          </div>

          <!-- Ticket panel -->
          <div class="ev-ticket-panel">
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
              <span class="ticket-total-price" id="totalDisplay">R${firstPrice.toLocaleString()}</span>
            </div>
            ${authGateHTML}
            ${purchaseBtnHTML}
            <p class="ticket-notice">Secure checkout · &FRIENDS Ticketing</p>
          </div>

        </div><!-- /ev-split-right -->
      </div><!-- /ev-split -->

      <!-- CONFIRMATION MODAL -->
      <div class="modal-backdrop" id="confirmationModal" style="display:none;">
        <div class="modal modal--confirmation">
          <button class="modal-close" onclick="closeConfirmationModal()">✕</button>
          <div class="modal-confirmation-header">
            <span class="modal-ticket-logo">&amp;FRIENDS</span>
            <span class="modal-confirmation-badge">Confirm Ticket</span>
          </div>
          <div class="modal-confirmation-body">
            <h2 class="modal-confirmation-title">Review Your Ticket</h2>
            
            <!-- Event Summary -->
            <div class="confirmation-section">
              <h3 class="confirmation-section-title">Event Details</h3>
              <div class="confirmation-event-card">
                <div class="confirmation-event-name" id="confEventName"></div>
                <div class="confirmation-event-meta">
                  <span>📅 <span id="confEventDate"></span></span>
                  <span>⏰ <span id="confEventTime"></span></span>
                  <span>📍 <span id="confEventLocation"></span></span>
                </div>
              </div>
            </div>

            <!-- Ticket Summary -->
            <div class="confirmation-section">
              <h3 class="confirmation-section-title">Ticket Summary</h3>
              <div class="confirmation-ticket-card">
                <div class="confirmation-ticket-row">
                  <span class="confirmation-label">Ticket Type:</span>
                  <span class="confirmation-value" id="confTicketTier"></span>
                </div>
                <div class="confirmation-ticket-row">
                  <span class="confirmation-label">Quantity:</span>
                  <span class="confirmation-value" id="confQuantity"></span>
                </div>
                <div class="confirmation-ticket-row">
                  <span class="confirmation-label">Price per ticket:</span>
                  <span class="confirmation-value" id="confPricePerTicket"></span>
                </div>
                <div class="confirmation-ticket-row total-row">
                  <span class="confirmation-label">Total Amount:</span>
                  <span class="confirmation-value total-amount" id="confTotal"></span>
                </div>
              </div>
            </div>

            <!-- Attendee Info -->
            <div class="confirmation-section">
              <h3 class="confirmation-section-title">Ticket Holder</h3>
              <div class="confirmation-attendee-card">
                <div class="confirmation-ticket-row">
                  <span class="confirmation-label">Name:</span>
                  <span class="confirmation-value" id="confAttendeeName"></span>
                </div>
                <div class="confirmation-ticket-row">
                  <span class="confirmation-label">Email:</span>
                  <span class="confirmation-value" id="confAttendeeEmail"></span>
                </div>
              </div>
            </div>

            <!-- Terms -->
            <div class="confirmation-terms">
              <label class="terms-checkbox">
                <input type="checkbox" id="termsCheckbox">
                <span>I confirm that all information is correct and agree to the <a href="#" onclick="return false;">terms & conditions</a>. Tickets are non-refundable.</span>
              </label>
            </div>

            <!-- Action Buttons -->
            <div class="confirmation-actions">
              <button class="btn-secondary" onclick="closeConfirmationModal()">Cancel</button>
              <button class="btn-primary" id="confirmPurchaseBtn" onclick="handlePurchase()" disabled>Confirm Purchase</button>
            </div>
          </div>
        </div>
      </div>

      <!-- TICKET MODAL (Success) -->
      <div class="modal-backdrop" id="ticketModal" style="display:none;">
        <div class="modal modal--ticket">
          <button class="modal-close" onclick="document.getElementById('ticketModal').style.display='none'">✕</button>
          <div class="modal-ticket-header">
            <span class="modal-ticket-logo">&amp;FRIENDS</span>
            <span class="modal-ticket-tag" id="tModalTag"></span>
          </div>
          <div class="modal-ticket-body">
            <h2 class="modal-ticket-title" id="tModalTitle"></h2>
            <div class="modal-ticket-meta" id="tModalMeta"></div>
            <div class="modal-ticket-divider">
              <span class="divider-circle left"></span>
              <div class="divider-dashes"></div>
              <span class="divider-circle right"></span>
            </div>
            <div class="modal-ticket-qr-wrap">
              <div id="ticketQR"></div>
              <p class="modal-ticket-qr-label">Scan at entrance</p>
            </div>
            <div class="modal-ticket-details" id="tModalDetails"></div>
          </div>
          <div class="modal-ticket-footer">
            <button class="btn-download" onclick="downloadTicket()">Download Ticket</button>
            <button class="btn-view-tickets" onclick="viewMyTickets()">View My Tickets</button>
          </div>
        </div>
      </div>`;
}

// Enable confirm button when terms are checked
function setupTermsListener() {
    const termsCheckbox = document.getElementById('termsCheckbox');
    const confirmBtn = document.getElementById('confirmPurchaseBtn');
    if (termsCheckbox && confirmBtn) {
        termsCheckbox.addEventListener('change', function() {
            confirmBtn.disabled = !this.checked;
        });
    }
}

// Open confirmation modal
function openConfirmationModal() {
    const session = Store.Auth.getSession();
    if (!session) {
        openAuthModal('login');
        return;
    }
    if (!selectedTier || !selectedTier.available) {
        alert('Please select an available ticket tier.');
        return;
    }

    // Populate confirmation modal with event and ticket details
    const total = selectedTier.price * qty;
    const sessionUser = Store.Auth.getSession();

    document.getElementById('confEventName').textContent = currentEvent.title;
    document.getElementById('confEventDate').textContent = currentEvent.date;
    document.getElementById('confEventTime').textContent = currentEvent.time;
    document.getElementById('confEventLocation').textContent = currentEvent.location;
    document.getElementById('confTicketTier').textContent = selectedTier.tier;
    document.getElementById('confQuantity').textContent = qty;
    document.getElementById('confPricePerTicket').textContent = `R${selectedTier.price.toLocaleString()}`;
    document.getElementById('confTotal').textContent = `R${total.toLocaleString()}`;
    document.getElementById('confAttendeeName').textContent = sessionUser?.name || sessionUser?.email?.split('@')[0] || 'Guest';
    document.getElementById('confAttendeeEmail').textContent = sessionUser?.email || 'No email';

    // Reset terms checkbox
    const termsCheckbox = document.getElementById('termsCheckbox');
    if (termsCheckbox) termsCheckbox.checked = false;
    
    const confirmBtn = document.getElementById('confirmPurchaseBtn');
    if (confirmBtn) confirmBtn.disabled = true;

    // Show modal
    document.getElementById('confirmationModal').style.display = 'flex';
    
    // Setup terms listener
    setupTermsListener();
}

// Close confirmation modal
function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
}

/* ── Tier / qty / purchase ────────────────────────────────────────── */
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
    document.getElementById('totalDisplay').textContent =
        'R' + (selectedTier.price * qty).toLocaleString();
}

async function handlePurchase() {
    const session = Store.Auth.getSession();
    if (!session) { 
        closeConfirmationModal();
        openAuthModal('login'); 
        return; 
    }
    if (!selectedTier || !selectedTier.available) {
        alert('Please select an available ticket tier.');
        closeConfirmationModal();
        return;
    }

    const confirmBtn = document.getElementById('confirmPurchaseBtn');
    if (confirmBtn) { 
        confirmBtn.disabled = true; 
        confirmBtn.textContent = 'Processing...'; 
    }

    const result = await Store.Tickets.purchase(
        currentEvent.id, selectedTier.tier, qty, session
    );

    if (confirmBtn) { 
        confirmBtn.disabled = false; 
        confirmBtn.textContent = 'Confirm Purchase'; 
    }

    if (!result.ok) { 
        alert(result.error); 
        return; 
    }

    // Close confirmation modal and show ticket modal
    closeConfirmationModal();
    showTicketModal(result.ticket);
}

function showTicketModal(ticket) {
    document.getElementById('tModalTag').textContent   = ticket.tag || 'LIVE EVENT';
    document.getElementById('tModalTitle').textContent = ticket.eventTitle;
    document.getElementById('tModalMeta').innerHTML    = `
      <span>${ticket.eventDate}</span>
      <span class="meta-divider">•</span>
      <span>${escapeHtml(ticket.eventLocation)}</span>`;

    document.getElementById('tModalDetails').innerHTML = `
      <div class="modal-ticket-details-top">
        <div class="modal-ticket-card">
          <span class="ticket-main-label">PASS TYPE</span>
          <h3>${escapeHtml(ticket.tier)}</h3>
        </div>
        <div class="modal-ticket-card">
          <span class="ticket-main-label">TOTAL</span>
          <h3>R${ticket.total.toLocaleString()}</h3>
        </div>
      </div>
      <div class="modal-ticket-grid">
        <div class="modal-ticket-row">
          <span class="detail-label">Ticket Holder</span>
          <strong>${escapeHtml(ticket.userName)}</strong>
        </div>
        <div class="modal-ticket-row">
          <span class="detail-label">Quantity</span>
          <strong>${ticket.quantity}</strong>
        </div>
        <div class="modal-ticket-row">
          <span class="detail-label">Ticket ID</span>
          <strong>${ticket.id}</strong>
        </div>
      </div>`;

    const qrEl = document.getElementById('ticketQR');
    qrEl.innerHTML = '';
    new QRCode(qrEl, {
        text: JSON.stringify({ id: ticket.id, event: ticket.eventId, user: ticket.userId }),
        width: 180, height: 180,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById('ticketModal').style.display = 'flex';
}

function downloadTicket() {
    // Simple print/save as PDF functionality
    const modalContent = document.querySelector('.modal--ticket');
    if (modalContent) {
        const originalDisplay = modalContent.style.display;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Your Ticket - &FRIENDS</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        .ticket { border: 2px solid #e85d04; border-radius: 16px; padding: 20px; max-width: 500px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
                        .qr { text-align: center; margin: 20px 0; }
                        .details { margin: 20px 0; }
                        .row { display: flex; justify-content: space-between; padding: 8px 0; }
                        .label { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="ticket">
                        <div class="header">
                            <h2>&amp;FRIENDS — Official Ticket</h2>
                        </div>
                        <div class="qr" id="qrForPrint"></div>
                        <div class="details" id="detailsForPrint"></div>
                    </div>
                    <script>
                        const qrDiv = document.getElementById('qrForPrint');
                        const detailsDiv = document.getElementById('detailsForPrint');
                        const originalQR = document.querySelector('#ticketQR canvas');
                        if (originalQR) {
                            const clonedQR = originalQR.cloneNode(true);
                            qrDiv.appendChild(clonedQR);
                        }
                        const detailsHTML = document.querySelector('.modal-ticket-details')?.innerHTML;
                        if (detailsHTML) detailsDiv.innerHTML = detailsHTML;
                    <\/script>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    } else {
        window.print();
    }
}

function viewMyTickets() {
    window.location.href = '../user_tickets.html';
}

function escapeHtml(str) {
    if (!str) return '';
    str = String(str);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}