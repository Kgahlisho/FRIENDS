// &FRIENDS — Event Detail Page Logic

let currentEvent = null;
let selectedTier = null;
let quantity = 1;

// ── Bootstrap ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    if (!eventId) {
        window.location.href = 'play.html';
        return;
    }

    currentEvent = getEventById(eventId);

    if (!currentEvent) {
        window.location.href = 'play.html';
        return;
    }

    renderEventDetail(currentEvent);
    renderTicketPanel(currentEvent);
    updateAuthUI();
});

// ── Render event details ─────────────────────────────────────
function renderEventDetail(event) {
    document.title = `&FRIENDS — ${event.title}`;

    document.getElementById('eventHeroImg').src = event.image;
    document.getElementById('eventHeroImg').alt = event.title;
    document.getElementById('eventTag').textContent = event.tag;
    document.getElementById('eventTitle').textContent = event.title;
    document.getElementById('eventDateText').textContent = event.date;
    document.getElementById('eventTimeText').textContent = event.time;
    document.getElementById('eventDescription').textContent = event.description;

    // Lineup
    if (event.lineup && event.lineup.length > 0) {
        const lineupBlock = document.getElementById('lineupBlock');
        lineupBlock.style.display = 'block';
        const lineupEl = document.getElementById('eventLineup');
        lineupEl.innerHTML = event.lineup.map(p => `
            <div class="lineup-item">
                <span class="lineup-name">${p.name}</span>
                <span class="lineup-role">${p.role}</span>
            </div>
        `).join('');
    }
}

// ── Render ticket tiers ──────────────────────────────────────
function renderTicketPanel(event) {
    const container = document.getElementById('ticketTiers');
    container.innerHTML = event.tickets.map((t, i) => `
        <div class="ticket-tier ${i === 0 ? 'selected' : ''}" 
             data-index="${i}" 
             data-price="${t.price}"
             onclick="selectTier(this, ${i})">
            <div class="tier-info">
                <span class="tier-name">${t.tier}</span>
                ${!t.available ? '<span class="tier-sold">Sold Out</span>' : ''}
            </div>
            <span class="tier-price">R${t.price}</span>
        </div>
    `).join('');

    // Set default
    selectedTier = event.tickets[0];
    updateTotal();
}

function selectTier(el, index) {
    document.querySelectorAll('.ticket-tier').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
    selectedTier = currentEvent.tickets[index];
    updateTotal();
}

// ── Quantity controls ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('qtyMinus').addEventListener('click', () => {
        if (quantity > 1) { quantity--; updateQty(); }
    });
    document.getElementById('qtyPlus').addEventListener('click', () => {
        if (quantity < 8) { quantity++; updateQty(); }
    });
});

function updateQty() {
    document.getElementById('qtyValue').textContent = quantity;
    updateTotal();
}

function updateTotal() {
    if (!selectedTier) return;
    const total = selectedTier.price * quantity;
    document.getElementById('totalPrice').textContent = `R${total.toLocaleString()}`;
}

// ── Auth UI ──────────────────────────────────────────────────
function updateAuthUI() {
    const gate = document.getElementById('authGate');
    const btn = document.getElementById('btnPurchase');
    if (AUTH_STATE.isLoggedIn()) {
        gate.style.display = 'none';
        btn.style.display = 'block';
    } else {
        gate.style.display = 'block';
        btn.style.display = 'none';
    }
}

// ── Modals ───────────────────────────────────────────────────
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}
function openRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
}
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}
function switchModal(from, to) {
    closeModal(from);
    document.getElementById(to).style.display = 'flex';
}

// Close on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        e.target.style.display = 'none';
    }
});

// ── Auth handlers ────────────────────────────────────────────
function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    if (!email || !pass) { alert('Please fill in all fields.'); return; }
    // Simulate login
    AUTH_STATE.login(email.split('@')[0], email);
    closeModal('loginModal');
    updateAuthUI();
}

function handleRegister() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;
    if (!name || !email || !pass) { alert('Please fill in all fields.'); return; }
    AUTH_STATE.login(name, email);
    closeModal('registerModal');
    updateAuthUI();
}

// ── Purchase ─────────────────────────────────────────────────
function handlePurchase() {
    if (!AUTH_STATE.isLoggedIn()) { openLoginModal(); return; }
    if (!selectedTier || !selectedTier.available) { alert('Please select an available ticket tier.'); return; }

    const user = AUTH_STATE.user;
    const ticketId = 'TKT-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    const total = selectedTier.price * quantity;

    const ticket = {
        id: ticketId,
        userId: user.id,
        userName: user.name,
        eventId: currentEvent.id,
        eventTitle: currentEvent.title,
        eventDate: currentEvent.date,
        tier: selectedTier.tier,
        quantity,
        total,
        tag: currentEvent.tag,
        purchasedAt: new Date().toISOString()
    };

    TICKET_STORE.save(ticket);
    showTicketModal(ticket);
}

function showTicketModal(ticket) {
    document.getElementById('modalTag').textContent = ticket.tag;
    document.getElementById('modalTitle').textContent = ticket.eventTitle;
    document.getElementById('modalDate').textContent = ticket.eventDate;
    document.getElementById('modalHolder').textContent = ticket.userName;
    document.getElementById('modalTier').textContent = ticket.tier;
    document.getElementById('modalQty').textContent = ticket.quantity;
    document.getElementById('modalTotal').textContent = `R${ticket.total.toLocaleString()}`;
    document.getElementById('modalTicketId').textContent = ticket.id;

    // Generate QR
    const qrEl = document.getElementById('qrCode');
    qrEl.innerHTML = '';
    const qrData = JSON.stringify({ id: ticket.id, event: ticket.eventId, user: ticket.userId });
    new QRCode(qrEl, {
        text: qrData,
        width: 160,
        height: 160,
        colorDark: '#2c1a0e',
        colorLight: '#fdf6f2',
        correctLevel: QRCode.CorrectLevel.H
    });

    document.getElementById('ticketModal').style.display = 'flex';
}

function downloadTicket() {
    // Placeholder — in production, generate a PDF ticket
    alert('Ticket download coming soon. Your ticket has been saved to your account.');
}