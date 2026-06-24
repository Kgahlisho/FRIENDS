/**
 * &FRIENDS — js/dashboard.js
 * Firebase-safe dashboard (async fetch + cached sync rendering)
 */

// ─────────────────────────────────────────────────────────────
// AUTH GUARD - Wait for Firebase auth before loading
// ─────────────────────────────────────────────────────────────
(async function initAdminDashboard() {
    try {
        // Wait for auth to be ready
        await Store.Auth.waitForAuth();
        
        // Check if user is admin
        if (!Store.Auth.isAdmin()) {
            console.warn('Not an admin, redirecting to home');
            window.location.href = '../html/index.html';
            return;
        }
        
        // Render sidebar after auth is confirmed
        document.getElementById('sidebarMount').outerHTML = renderAdminSidebar('dashboard.html');
        
        // Now load dashboard data
        await loadDashboardData();
        
        // Hide loading overlay
        const overlay = document.getElementById('adminLoadingOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
        
    } catch (err) {
        console.error('Auth error:', err);
        window.location.href = '../html/index.html';
    }
})();

// ─────────────────────────────────────────────────────────────
// LOAD DASHBOARD DATA
// ─────────────────────────────────────────────────────────────
async function loadDashboardData() {
    try {
        // Fetch all required data with timeout
        const fetchPromise = Promise.all([
            Store.Events.fetchAll(),
            Store.Tickets.fetchAll(),
            Store.Users.fetchAll(),
            Store.Gallery.fetchAll(),
        ]);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Data loading timeout after 15 seconds')), 15000);
        });
        
        await Promise.race([fetchPromise, timeoutPromise]);
        
        // Render dashboard
        renderStats();
        renderRecentEvents();
        renderRecentTickets();
        
    } catch (err) {
        console.error('Dashboard load error:', err);
        showErrorState(err.message);
    }
}

// ─────────────────────────────────────────────────────────────
// SHOW ERROR STATE
// ─────────────────────────────────────────────────────────────
function showErrorState(errorMessage) {
    const statsGrid = document.getElementById('statsGrid');
    
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card" style="grid-column:1/-1; text-align:center; background: rgba(244, 67, 54, 0.1); border-color: #f44336;">
                <div class="stat-icon">⚠️</div>
                <div class="stat-value" style="color: #f44336;">Error</div>
                <div class="stat-label">${escapeHtml(errorMessage)}</div>
                <button onclick="location.reload()" style="margin-top:16px; padding:8px 20px; background: var(--orange); color:white; border:none; border-radius:8px; cursor:pointer;">Retry</button>
            </div>
        `;
    }
    
    const recentEvents = document.getElementById('recentEvents');
    if (recentEvents) {
        recentEvents.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">⚠️</div>
                <p>Failed to load events</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top:12px;">Retry</button>
            </div>
        `;
    }
    
    const recentTickets = document.getElementById('recentTickets');
    if (recentTickets) {
        recentTickets.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">⚠️</div>
                <p>Failed to load tickets</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top:12px;">Retry</button>
            </div>
        `;
    }
}

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────
function renderStats() {
    const events = Store.Events.getAll() || [];
    const tickets = Store.Tickets.getAll() || [];
    const users = Store.Users.getAll() || [];

    const revenue = tickets.reduce((sum, t) => sum + (t.total || 0), 0);
    const publishedEvents = events.filter(e => e.status === 'published').length;
    const residents = users.filter(u => u.role === 'resident').length;
    const galleryCampaigns = Store.Gallery.getPublished()?.length || 0;
    const draftEvents = events.filter(e => e.status === 'draft').length;

    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;

    statsGrid.innerHTML = [
        {
            icon: '🗓',
            value: publishedEvents,
            label: 'Published Events',
            accent: false
        },
        {
            icon: '🎟',
            value: tickets.length,
            label: 'Tickets Sold',
            accent: false
        },
        {
            icon: '👥',
            value: residents,
            label: 'Residents',
            accent: false
        },
        {
            icon: '💰',
            value: 'R' + revenue.toLocaleString(),
            label: 'Total Revenue',
            accent: true
        },
        {
            icon: '🖼',
            value: galleryCampaigns,
            label: 'Gallery Campaigns',
            accent: false
        },
        {
            icon: '📝',
            value: draftEvents,
            label: 'Draft Events',
            accent: false
        },
    ].map(s => `
        <div class="stat-card ${s.accent ? 'accent' : ''}">
            <div class="stat-icon">${s.icon}</div>
            <div class="stat-value">${s.value}</div>
            <div class="stat-label">${s.label}</div>
        </div>
    `).join('');
}

// ─────────────────────────────────────────────────────────────
// RECENT EVENTS
// ─────────────────────────────────────────────────────────────
function renderRecentEvents() {
    const events = Store.Events
        .getAll()
        .slice()
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : 0;
            const dateB = b.createdAt ? new Date(b.createdAt) : 0;
            return dateB - dateA;
        })
        .slice(0, 5);

    const el = document.getElementById('recentEvents');
    if (!el) return;

    if (!events.length) {
        el.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">🗓</div>
                <p>No events yet. Create your first event!</p>
                <a href="events.html" class="btn-primary" style="margin-top:12px;">+ Create Event</a>
            </div>`;
        return;
    }

    el.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${events.map(e => `
                    <tr onclick="window.location.href='events.html'" style="cursor:pointer;">
                        <td>
                            <strong>${escapeHtml(e.title || 'Untitled')}</strong><br>
                            <small style="color:var(--admin-muted)">${escapeHtml(e.tag || 'Uncategorized')}</small>
                        </div>
                        <td style="font-size:13px">${e.date || 'TBA'}</td>
                        <td>
                            <span class="badge badge-${e.status || 'draft'}">
                                ${e.status || 'draft'}
                            </span>
                        </div>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ─────────────────────────────────────────────────────────────
// RECENT TICKETS
// ─────────────────────────────────────────────────────────────
function renderRecentTickets() {
    const tickets = Store.Tickets
        .getAll()
        .slice()
        .sort((a, b) => {
            const dateA = a.purchasedAt ? new Date(a.purchasedAt) : 0;
            const dateB = b.purchasedAt ? new Date(b.purchasedAt) : 0;
            return dateB - dateA;
        })
        .slice(0, 5);

    const el = document.getElementById('recentTickets');
    if (!el) return;

    if (!tickets.length) {
        el.innerHTML = `
            <div class="admin-empty">
                <div class="admin-empty-icon">🎟</div>
                <p>No ticket sales yet.</p>
                <a href="events.html" class="btn-primary" style="margin-top:12px;">Create an Event</a>
            </div>`;
        return;
    }

    el.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Buyer</th>
                    <th>Event</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${tickets.map(t => `
                    <tr onclick="window.location.href='tickets.html'" style="cursor:pointer;">
                        <td>
                            <strong>${escapeHtml(t.userName || 'Unknown')}</strong><br>
                            <small style="color:var(--admin-muted)">${escapeHtml(t.id || 'No ID')}</small>
                         </div>
                        <td style="font-size:13px">${escapeHtml(t.eventTitle || 'Unknown Event')}</td>
                        <td>
                            <strong>R${(t.total || 0).toLocaleString()}</strong>
                         </div>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────
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