/**
 * &FRIENDS — js/user-tickets.js
 * Deferred auth guard — waits for Firebase onAuthStateChanged.
 */

// ─────────────────────────────────────────────
// DEFERRED AUTH GUARD
// ─────────────────────────────────────────────
(function deferredGuard() {
    if (Store.Auth.isLoggedIn()) return;

    const overlay = document.createElement('div');
    overlay.id = 'authOverlay';
    overlay.style.cssText =
        'position:fixed;inset:0;background:#1a1008;z-index:9999;' +
        'display:flex;align-items:center;justify-content:center;' +
        'color:#f5e6d0;font-family:sans-serif;font-size:14px;';
    overlay.innerHTML = '<span>Loading…</span>';
    document.body.appendChild(overlay);

    function check() {
        const o = document.getElementById('authOverlay');
        if (o) o.remove();
        if (!Store.Auth.isLoggedIn()) {
            window.location.href = 'html/index.html';
        }
    }

    document.addEventListener('af:auth', check, { once: true });
    setTimeout(() => { if (document.getElementById('authOverlay')) check(); }, 5000);
})();

let session = null;

// ─────────────────────────────────────────────
// BROWSE EVENTS VARIABLES
// ─────────────────────────────────────────────
let browseEvents = [];
let currentBrowseFilter = 'all';
let modalCurrentEvent = null;
let modalSelectedTier = null;
let modalQty = 1;

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (Store.Auth.isLoggedIn()) {
        _bootTickets();
    } else {
        document.addEventListener('af:auth', () => {
            if (Store.Auth.isLoggedIn()) _bootTickets();
        }, { once: true });
    }
});

async function _bootTickets() {
    session = Store.Auth.getSession();
    if (!session) return;

    // Sidebar
    const sidebarUser = document.getElementById('sidebarUser');
    if (sidebarUser) {
        sidebarUser.innerHTML = `
      <div class="user-avatar">${session.name.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${escapeHtml(session.name)}</div>
        <div class="user-role" style="color:var(--gold);">Resident</div>
      </div>`;
    }

    try {
        await Promise.all([
            Store.Tickets.fetchByUser(session.id),
            Store.Events.fetchPublished()
        ]);
        browseEvents = Store.Events.getPublished() || [];
    } catch (err) {
        console.warn('Data fetch error:', err);
        browseEvents = [];
    }

    renderStats();
    renderTickets();
}

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
function renderStats() {
    const tickets = Store.Tickets.getByUser(session.id);
    const spent   = tickets.reduce((sum, t) => sum + (t.total || 0), 0);
    const active  = tickets.filter(t => !t.validated).length;

    const container = document.getElementById('ticketStats');
    if (!container) return;

    container.innerHTML = [
        { icon: '🎟', value: tickets.length,              label: 'Total Tickets' },
        { icon: '✅', value: active,                       label: 'Active Tickets' },
        { icon: '💳', value: 'R' + spent.toLocaleString(), label: 'Total Spent', accent: true },
    ].map(s => `
    <div class="stat-card ${s.accent ? 'accent' : ''}">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`).join('');
}

// ─────────────────────────────────────────────
// TICKETS RENDER
// ─────────────────────────────────────────────
function renderTickets() {
    const filter  = document.getElementById('filterStatus')?.value || 'all';
    let tickets   = Store.Tickets.getByUser(session.id);

    if (filter === 'active') tickets = tickets.filter(t => !t.validated);
    if (filter === 'used')   tickets = tickets.filter(t =>  t.validated);

    const grid = document.getElementById('ticketGrid');
    if (!grid) return;

    if (!tickets.length) {
        grid.innerHTML = `
      <div style="grid-column:1/-1;">
        <div class="admin-empty">
          <div class="admin-empty-icon">🎟</div>
          <h3>No ${filter === 'all' ? '' : filter + ' '}tickets found</h3>
          <p>Browse events and secure your tickets.</p>
          <button class="btn-primary" onclick="showEventsSection()">Browse Events →</button>
        </div>
      </div>`;
        return;
    }

    grid.innerHTML = tickets.map(t => `
    <div class="rf-ticket" onclick="openTicketModal('${t.id}')">
      <div class="rf-ticket-top">
        <div class="rf-ticket-tag">${escapeHtml(t.tag || 'Event')}</div>
        <div class="rf-ticket-title">${escapeHtml(t.eventTitle)}</div>
        <div class="rf-ticket-meta">
          ${escapeHtml(t.eventDate)} · ${escapeHtml(t.eventLocation || '5 De Beer St, Braamfontein')}
        </div>
      </div>
      <div class="rf-perf">
        <div class="rf-perf-hole l"></div>
        <div class="rf-perf-line"></div>
        <div class="rf-perf-hole r"></div>
      </div>
      <div class="rf-ticket-bottom">
        <div class="rf-ticket-details">
          ${[
            ['Holder', t.userName],
            ['Tier',   t.tier],
            ['Qty',    t.quantity],
            ['Total',  'R' + (t.total || 0).toLocaleString()],
          ].map(([label, value]) => `
            <div class="rf-detail-row">
              <span>${label}</span>
              <strong style="font-size:11px;">${escapeHtml(String(value))}</strong>
            </div>`).join('')}
        </div>
        <div class="rf-qr" id="qr-${t.id}"></div>
      </div>
      <div class="rf-ticket-status ${t.validated ? 'status-used' : 'status-active'}">
        <span>
          <span class="status-dot"></span>
          ${t.validated
            ? 'Used · ' + new Date(t.validatedAt).toLocaleDateString()
            : 'Active — Valid for entry'}
        </span>
        <span style="opacity:.5;">${new Date(t.purchasedAt).toLocaleDateString()}</span>
      </div>
    </div>`).join('');

    generateQRCodes(tickets);
}

// ─────────────────────────────────────────────
// QR CODES
// ─────────────────────────────────────────────
function generateQRCodes(tickets) {
    setTimeout(() => {
        tickets.forEach(t => {
            const el = document.getElementById('qr-' + t.id);
            if (!el || el.querySelector('canvas')) return;
            new QRCode(el, {
                text: JSON.stringify({ id: t.id, event: t.eventId, user: t.userId }),
                width: 88, height: 88,
                colorDark: '#2c1a0e', colorLight: '#fdf6f2',
                correctLevel: QRCode.CorrectLevel.H,
            });
        });
    }, 50);
}

// ─────────────────────────────────────────────
// TICKET MODAL - Large QR Code for Scanning
// ─────────────────────────────────────────────
let currentTicket = null;

function openTicketModal(ticketId) {
    const ticket = Store.Tickets.getById(ticketId);
    if (!ticket) return;
    
    currentTicket = ticket;
    
    document.getElementById('modalTicketTag').textContent = ticket.tag || 'LIVE EVENT';
    document.getElementById('modalTicketTitle').textContent = ticket.eventTitle;
    document.getElementById('modalTicketMeta').innerHTML = `
        <span>📅 ${escapeHtml(ticket.eventDate)}</span>
        <span>⏰ ${escapeHtml(ticket.eventTime || 'Time TBA')}</span>
        <span>📍 ${escapeHtml(ticket.eventLocation || '5 De Beer St, Braamfontein')}</span>
    `;
    
    document.getElementById('modalTicketDetails').innerHTML = `
        <div class="modal-detail-row">
            <span class="modal-detail-label">Ticket Holder</span>
            <span class="modal-detail-value">${escapeHtml(ticket.userName)}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Ticket Type</span>
            <span class="modal-detail-value">${escapeHtml(ticket.tier)}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Quantity</span>
            <span class="modal-detail-value">${ticket.quantity}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Total Paid</span>
            <span class="modal-detail-value price">R${(ticket.total || 0).toLocaleString()}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Ticket ID</span>
            <span class="modal-detail-value">${ticket.id}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Purchase Date</span>
            <span class="modal-detail-value">${new Date(ticket.purchasedAt).toLocaleDateString()}</span>
        </div>
        <div class="modal-detail-row">
            <span class="modal-detail-label">Status</span>
            <span class="modal-detail-value ${ticket.validated ? 'used' : 'active'}">
                ${ticket.validated ? '✓ Used' : '● Active'}
            </span>
        </div>
    `;
    
    const qrContainer = document.getElementById('modalLargeQR');
    qrContainer.innerHTML = '';
    
    new QRCode(qrContainer, {
        text: JSON.stringify({ 
            id: ticket.id, 
            event: ticket.eventId, 
            user: ticket.userId,
            timestamp: Date.now()
        }),
        width: 280, 
        height: 280,
        colorDark: '#2c1a0e', 
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    document.getElementById('ticketViewModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeTicketModal() {
    document.getElementById('ticketViewModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function downloadTicketAsImage() {
    if (!currentTicket) return;
    
    const modalContent = document.querySelector('.ticket-modal-content');
    if (!modalContent) return;
    
    if (typeof html2canvas !== 'undefined') {
        html2canvas(modalContent, {
            scale: 2,
            backgroundColor: '#fdf6f2'
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `ticket_${currentTicket.id}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    } else {
        window.print();
    }
}

function printTicket() {
    window.print();
}

// ─────────────────────────────────────────────
// BROWSE EVENTS FUNCTIONS
// ─────────────────────────────────────────────
function showEventsSection() {
    document.getElementById('ticketsView').style.display = 'none';
    document.getElementById('eventsView').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Browse Events';
    document.getElementById('filterContainer').style.display = 'none';
    renderBrowseEvents();
}

function showTicketsView() {
    document.getElementById('ticketsView').style.display = 'block';
    document.getElementById('eventsView').style.display = 'none';
    document.getElementById('pageTitle').textContent = 'My Tickets';
    document.getElementById('filterContainer').style.display = 'block';
    renderTickets();
}

function filterBrowseEvents(category) {
    currentBrowseFilter = category;
    
    document.querySelectorAll('#filterBar .filter-chip').forEach(chip => {
        if (chip.getAttribute('data-filter') === category) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
    
    renderBrowseEvents();
}

function renderBrowseEvents() {
    const container = document.getElementById('browseEventsGrid');
    if (!container) return;
    
    let events = browseEvents;
    
    if (currentBrowseFilter !== 'all') {
        events = events.filter(e => e.tag === currentBrowseFilter);
    }
    
    events = [...events].sort((a, b) => {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA);
    });
    
    if (!events.length) {
        container.innerHTML = `
            <div class="no-events">
                <div style="font-size: 48px; margin-bottom: 16px;">🎟</div>
                <h3>No events found</h3>
                <p style="color: var(--admin-muted);">Check back later for upcoming events.</p>
            </div>`;
        return;
    }
    
    container.innerHTML = events.map(e => {
        const imgSrc = e.image && (e.image.startsWith('http') || e.image.startsWith('data:'))
            ? e.image : (e.image ? '../' + e.image : '../Resources/placeholder.jpg');
        const firstPrice = e.tickets?.[0]?.price || 0;
        
        return `
            <div class="browse-event-card" onclick="openEventFromTickets('${e.id}')">
                <img src="${imgSrc}" alt="${escapeHtml(e.title)}" class="browse-event-img" onerror="this.src='../Resources/placeholder.jpg'" />
                <div class="browse-event-content">
                    <span class="browse-event-tag">${escapeHtml(e.tag)}</span>
                    <h3 class="browse-event-title">${escapeHtml(e.title)}</h3>
                    <div class="browse-event-meta">
                        📅 ${e.date}<br>
                        ⏰ ${e.time}<br>
                        📍 ${escapeHtml(e.location || '5 De Beer St, Braamfontein')}
                    </div>
                    <div class="browse-event-footer">
                        <span class="browse-event-price">From R${firstPrice.toLocaleString()}</span>
                        <button class="browse-event-btn" onclick="event.stopPropagation(); openEventFromTickets('${e.id}')">Get Tickets →</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ─────────────────────────────────────────────
// EVENT MODAL FUNCTIONS (for purchase)
// ─────────────────────────────────────────────
function openEventFromTickets(eventId) {
    const event = Store.Events.getById(eventId);
    if (!event) return;
    
    modalCurrentEvent = event;
    modalSelectedTier = event.tickets?.[0] || null;
    modalQty = 1;
    
    document.getElementById('modalEventTitle').textContent = event.title;
    document.getElementById('modalEventName').textContent = event.title;
    document.getElementById('modalEventTag').textContent = event.tag || 'EVENT';
    
    const imgSrc = event.image && (event.image.startsWith('http') || event.image.startsWith('data:'))
        ? event.image : (event.image ? '../' + event.image : '../Resources/placeholder.jpg');
    document.getElementById('modalEventImage').src = imgSrc;
    
    document.getElementById('modalEventMeta').innerHTML = `
        <div class="meta-item">
            <span class="meta-icon">📅</span>
            <span>${event.date}</span>
        </div>
        <div class="meta-item">
            <span class="meta-icon">⏰</span>
            <span>${event.time}</span>
        </div>
        <div class="meta-item">
            <span class="meta-icon">📍</span>
            <span>${escapeHtml(event.location || '5 De Beer St, Braamfontein')}</span>
        </div>
        <div class="meta-item">
            <span class="meta-icon">🏷</span>
            <span>${escapeHtml(event.tag)}</span>
        </div>
    `;
    
    document.getElementById('modalEventDescription').innerHTML = event.description || 'No description available for this event.';
    
    const tiersContainer = document.getElementById('modalTicketTiers');
    if (event.tickets && event.tickets.length) {
        tiersContainer.innerHTML = event.tickets.map((t, i) => `
            <div class="dashboard-ticket-tier ${i === 0 ? 'selected' : ''} ${!t.available ? 'sold-out' : ''}"
                 onclick="selectModalTier(${i})">
                <span class="tier-name">${escapeHtml(t.tier)}</span>
                <span class="tier-price">R${t.price.toLocaleString()}</span>
            </div>
        `).join('');
    } else {
        tiersContainer.innerHTML = '<p style="text-align:center; padding:20px;">No tickets available</p>';
    }
    
    document.getElementById('modalQtyValue').textContent = '1';
    updateModalTotal();
    
    document.getElementById('dashboardEventModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEventModal() {
    document.getElementById('dashboardEventModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    modalCurrentEvent = null;
    modalSelectedTier = null;
    modalQty = 1;
}

function selectModalTier(index) {
    if (!modalCurrentEvent || !modalCurrentEvent.tickets) return;
    if (!modalCurrentEvent.tickets[index].available) return;
    
    modalSelectedTier = modalCurrentEvent.tickets[index];
    
    document.querySelectorAll('.dashboard-ticket-tier').forEach((tier, i) => {
        if (i === index) {
            tier.classList.add('selected');
        } else {
            tier.classList.remove('selected');
        }
    });
    
    updateModalTotal();
}

function changeModalQty(delta) {
    const newQty = modalQty + delta;
    if (newQty >= 1 && newQty <= 10) {
        modalQty = newQty;
        document.getElementById('modalQtyValue').textContent = modalQty;
        updateModalTotal();
    }
}

function updateModalTotal() {
    if (!modalSelectedTier) return;
    const total = modalSelectedTier.price * modalQty;
    document.getElementById('modalTotalPrice').textContent = `R${total.toLocaleString()}`;
}

function purchaseFromModal() {
    const session = Store.Auth.getSession();
    if (!session) {
        closeEventModal();
        alert('Please log in to purchase tickets.');
        return;
    }
    
    if (!modalSelectedTier || !modalSelectedTier.available) {
        alert('Please select an available ticket tier.');
        return;
    }
    
    showConfirmationModal();
}

function showConfirmationModal() {
    const total = modalSelectedTier.price * modalQty;
    const sessionUser = Store.Auth.getSession();
    
    document.getElementById('confirmEventName').textContent = modalCurrentEvent.title;
    document.getElementById('confirmEventDate').textContent = modalCurrentEvent.date;
    document.getElementById('confirmEventTime').textContent = modalCurrentEvent.time;
    document.getElementById('confirmEventLocation').textContent = modalCurrentEvent.location || '5 De Beer St, Braamfontein';
    document.getElementById('confirmTicketTier').textContent = modalSelectedTier.tier;
    document.getElementById('confirmQuantity').textContent = modalQty;
    document.getElementById('confirmPricePerTicket').textContent = `R${modalSelectedTier.price.toLocaleString()}`;
    document.getElementById('confirmTotalAmount').textContent = `R${total.toLocaleString()}`;
    document.getElementById('confirmAttendeeName').textContent = sessionUser?.name || 'Guest';
    document.getElementById('confirmAttendeeEmail').textContent = sessionUser?.email || 'No email';
    
    const termsCheckbox = document.getElementById('confirmTermsCheckbox');
    if (termsCheckbox) termsCheckbox.checked = false;
    
    const confirmBtn = document.getElementById('finalConfirmBtn');
    if (confirmBtn) confirmBtn.disabled = true;
    
    document.getElementById('confirmationModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setupTermsListener();
}

function setupTermsListener() {
    const termsCheckbox = document.getElementById('confirmTermsCheckbox');
    const confirmBtn = document.getElementById('finalConfirmBtn');
    if (termsCheckbox && confirmBtn) {
        termsCheckbox.onchange = function() {
            confirmBtn.disabled = !this.checked;
        };
    }
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function finalizePurchase() {
    const session = Store.Auth.getSession();
    if (!session) {
        closeConfirmationModal();
        alert('Please log in to purchase tickets.');
        return;
    }
    
    const confirmBtn = document.getElementById('finalConfirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';
    }
    
    const result = await Store.Tickets.purchase(
        modalCurrentEvent.id, modalSelectedTier.tier, modalQty, session
    );
    
    if (result.ok) {
        closeConfirmationModal();
        closeEventModal();
        alert(`✓ Success! ${modalQty} ticket(s) purchased for ${modalCurrentEvent.title}`);
        
        await Store.Tickets.fetchByUser(session.id);
        renderStats();
        renderTickets();
    } else {
        alert(`✗ Purchase failed: ${result.error}`);
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Purchase';
        }
    }
}

// ─────────────────────────────────────────────
// FILTER HOOK
// ─────────────────────────────────────────────
function applyTicketFilter() { renderTickets(); }

function handleLogout() {
    Store.Auth.logout();
    window.location.href = 'html/index.html';
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