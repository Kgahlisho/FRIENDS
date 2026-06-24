/**
 * &FRIENDS — js/user-dashboard.js
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
    setTimeout(() => {
        if (document.getElementById('authOverlay')) check();
    }, 5000);
})();

// ─────────────────────────────────────────────
// GLOBAL VARIABLES
// ─────────────────────────────────────────────
let allEvents = [];
let currentEventFilter = 'all';
let modalCurrentEvent = null;
let modalSelectedTier = null;
let modalQty = 1;

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
function resLogout() {
    Store.Auth.logout();
    window.location.href = 'html/index.html';
}

// ─────────────────────────────────────────────
// VIEW TOGGLES
// ─────────────────────────────────────────────
function showEventsSection() {
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('eventsView').style.display = 'block';
    renderAllEvents();
}

function showDashboardView() {
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('eventsView').style.display = 'none';
}

// ─────────────────────────────────────────────
// FILTER EVENTS
// ─────────────────────────────────────────────
function filterEvents(category) {
    currentEventFilter = category;
    
    document.querySelectorAll('.filter-chip').forEach(chip => {
        if (chip.getAttribute('data-filter') === category) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });
    
    renderAllEvents();
}

// ─────────────────────────────────────────────
// OPEN EVENT MODAL (Inline instead of redirect)
// ─────────────────────────────────────────────
function openEventModal(eventId) {
    const event = Store.Events.getById(eventId);
    if (!event) return;
    
    modalCurrentEvent = event;
    modalSelectedTier = event.tickets?.[0] || null;
    modalQty = 1;
    
    // Populate modal
    document.getElementById('modalEventTitle').textContent = event.title;
    document.getElementById('modalEventName').textContent = event.title;
    document.getElementById('modalEventTag').textContent = event.tag || 'EVENT';
    
    const imgSrc = event.image && (event.image.startsWith('http') || event.image.startsWith('data:'))
        ? event.image : (event.image ? '../' + event.image : '../Resources/placeholder.jpg');
    document.getElementById('modalEventImage').src = imgSrc;
    
    // Create meta grid with icons
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
    
    // Render ticket tiers
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

// ─────────────────────────────────────────────
// CONFIRMATION MODAL FUNCTIONS
// ─────────────────────────────────────────────
function showConfirmationModal() {
    if (!modalSelectedTier || !modalSelectedTier.available) {
        alert('Please select an available ticket tier.');
        return;
    }
    
    const total = modalSelectedTier.price * modalQty;
    const session = Store.Auth.getSession();
    
    // Populate confirmation modal
    document.getElementById('confirmEventName').textContent = modalCurrentEvent.title;
    document.getElementById('confirmEventDate').textContent = modalCurrentEvent.date;
    document.getElementById('confirmEventTime').textContent = modalCurrentEvent.time;
    document.getElementById('confirmEventLocation').textContent = modalCurrentEvent.location || '5 De Beer St, Braamfontein';
    document.getElementById('confirmTicketTier').textContent = modalSelectedTier.tier;
    document.getElementById('confirmQuantity').textContent = modalQty;
    document.getElementById('confirmPricePerTicket').textContent = `R${modalSelectedTier.price.toLocaleString()}`;
    document.getElementById('confirmTotalAmount').textContent = `R${total.toLocaleString()}`;
    document.getElementById('confirmAttendeeName').textContent = session?.name || 'Guest';
    document.getElementById('confirmAttendeeEmail').textContent = session?.email || 'No email';
    
    // Reset terms checkbox
    const termsCheckbox = document.getElementById('confirmTermsCheckbox');
    if (termsCheckbox) termsCheckbox.checked = false;
    
    const confirmBtn = document.getElementById('finalConfirmBtn');
    if (confirmBtn) confirmBtn.disabled = true;
    
    document.getElementById('confirmationModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Setup terms listener
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
        alert(`✓ Success! ${modalQty} ticket(s) purchased for ${modalCurrentEvent.title}\n\nYour ticket has been sent to your email.`);
        
        // Refresh data
        await Store.Tickets.fetchByUser(session.id);
        renderStats(session);
        renderRecentTickets(session);
    } else {
        alert(`✗ Purchase failed: ${result.error}`);
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirm Purchase';
        }
    }
}

// Update purchase button to show confirmation instead of direct purchase
async function purchaseFromModal() {
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
    
    // Show confirmation modal instead of direct purchase
    showConfirmationModal();
}

// ─────────────────────────────────────────────
// RENDER ALL EVENTS (Full Grid)
// ─────────────────────────────────────────────
function renderAllEvents() {
    const container = document.getElementById('allEventsGrid');
    if (!container) return;
    
    let events = allEvents;
    
    if (currentEventFilter !== 'all') {
        events = events.filter(e => e.tag === currentEventFilter);
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
            <div class="event-grid-card" onclick="openEventModal('${e.id}')">
                <img src="${imgSrc}" alt="${escapeHtml(e.title)}" class="event-grid-img" onerror="this.src='../Resources/placeholder.jpg'" />
                <div class="event-grid-content">
                    <span class="event-grid-tag">${escapeHtml(e.tag)}</span>
                    <h3 class="event-grid-title">${escapeHtml(e.title)}</h3>
                    <div class="event-grid-meta">
                        📅 ${e.date}<br>
                        ⏰ ${e.time}<br>
                        📍 ${escapeHtml(e.location || '5 De Beer St, Braamfontein')}
                    </div>
                    <div class="event-grid-footer">
                        <span class="event-grid-price">From R${firstPrice.toLocaleString()}</span>
                        <button class="event-grid-btn" onclick="event.stopPropagation(); openEventModal('${e.id}')">Get Tickets →</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ─────────────────────────────────────────────
// RENDER UPCOMING EVENTS PREVIEW
// ─────────────────────────────────────────────
function renderUpcomingEventsPreview() {
    const events = allEvents;
    const el = document.getElementById('upcomingEventsPreview');
    if (!el) return;

    const list = events.slice(0, 4);

    if (!list.length) {
        el.innerHTML = `<p style="font-size:14px;color:var(--admin-muted);">No events currently published.</p>`;
        return;
    }

    el.innerHTML = list.map(e => {
        const imgSrc = e.image && (e.image.startsWith('http') || e.image.startsWith('data:'))
            ? e.image : (e.image ? '../' + e.image : '../Resources/placeholder.jpg');
        return `
            <div class="upcoming-event-card" onclick="openEventModal('${e.id}')">
                <img src="${imgSrc}" alt="${escapeHtml(e.title)}" class="upcoming-event-img"
                     onerror="this.style.display='none'" />
                <div class="upcoming-event-info">
                    <div class="upcoming-event-tag">${escapeHtml(e.tag)}</div>
                    <div class="upcoming-event-title">${escapeHtml(e.title)}</div>
                    <div class="upcoming-event-meta">${e.date} · ${e.time}</div>
                    <button class="event-grid-btn" style="margin-top:8px;" onclick="event.stopPropagation(); openEventModal('${e.id}')">Get Tickets →</button>
                </div>
            </div>`;
    }).join('');
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (Store.Auth.isLoggedIn()) {
        _bootDashboard();
    } else {
        document.addEventListener('af:auth', () => {
            if (Store.Auth.isLoggedIn()) _bootDashboard();
        }, { once: true });
    }
});

async function _bootDashboard() {
    const session = Store.Auth.getSession();
    if (!session) return;

    const firstName = session.name?.split(' ')[0] || 'User';
    const dashGreeting = document.getElementById('dashGreeting');
    if (dashGreeting) dashGreeting.textContent = `Welcome back, ${firstName}`;

    const sidebarUser = document.getElementById('sidebarUser');
    if (sidebarUser) {
        sidebarUser.innerHTML = `
            <div class="user-avatar">${session.name?.charAt(0).toUpperCase() || 'U'}</div>
            <div class="user-info">
                <div class="user-name">${escapeHtml(session.name)}</div>
                <div class="user-role" style="color:var(--gold);">Resident</div>
            </div>`;
    }

    try {
        await Promise.all([
            Store.Tickets.fetchByUser(session.id),
            Store.Events.fetchPublished(),
        ]);
        
        allEvents = Store.Events.getPublished() || [];
        
    } catch (err) {
        console.warn('Dashboard data fetch error:', err);
        allEvents = [];
    }

    renderStats(session);
    renderRecentTickets(session);
    renderUpcomingEventsPreview();
}

function renderStats(session) {
    const tickets = Store.Tickets.getByUser(session.id) || [];
    const spent = tickets.reduce((sum, t) => sum + (t.total || 0), 0);
    const uniqueEvents = new Set(tickets.map(t => t.eventId)).size;

    const container = document.getElementById('resStats');
    if (!container) return;

    container.innerHTML = [
        { icon: '🎟', value: tickets.length, label: 'Tickets Purchased' },
        { icon: '📅', value: uniqueEvents, label: 'Events Attended' },
        { icon: '💳', value: 'R' + spent.toLocaleString(), label: 'Total Spent', accent: true },
    ].map(s => `
        <div class="stat-card ${s.accent ? 'accent' : ''}">
            <div class="stat-icon">${s.icon}</div>
            <div class="stat-value">${s.value}</div>
            <div class="stat-label">${s.label}</div>
        </div>`).join('');
}

function renderRecentTickets(session) {
    const tickets = (Store.Tickets.getByUser(session.id) || []).slice(0, 3);
    const el = document.getElementById('recentTickets');
    if (!el) return;

    if (!tickets.length) {
        el.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">🎟</div>
                <h3>No tickets yet</h3>
                <p>Purchase tickets to upcoming events.</p>
                <button class="btn-primary" onclick="showEventsSection()">Browse Events</button>
            </div>`;
        return;
    }

    el.innerHTML = tickets.map(t => `
        <div style="padding:14px 0;border-bottom:1px solid var(--admin-border);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <strong style="font-size:14px;">${escapeHtml(t.eventTitle)}</strong>
                    <div style="font-size:12px;color:var(--admin-muted);margin-top:2px;">
                        ${escapeHtml(t.tier)} · ${t.eventDate}
                    </div>
                </div>
                <span class="badge ${t.validated ? 'badge-validated' : 'badge-pending'}">
                    ${t.validated ? 'Used' : 'Active'}
                </span>
            </div>
        </div>`).join('');
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