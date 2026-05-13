/**
 * &FRIENDS — js/user-dashboard.js
 */

// Resident auth guard
        (function () {
            if (!Store.Auth.isLoggedIn()) window.location.href = 'html/index.html';
        })();

        function resLogout() { Store.Auth.logout(); window.location.href = 'html/index.html'; }

        document.addEventListener('DOMContentLoaded', () => {
            const session = Store.Auth.getSession();
            document.getElementById('dashGreeting').textContent = `Welcome, ${session.name.split(' ')[0]} 👋`;

            const userEl = document.getElementById('sidebarUser');
            userEl.innerHTML = `
        <div class="user-avatar">${session.name.charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <div class="user-name">${session.name}</div>
          <div class="user-role" style="color:var(--gold);">Resident</div>
        </div>`;

            renderStats(session);
            renderRecentTickets(session);
            renderUpcomingEvents(session);
        });

        function renderStats(session) {
            const myTickets = Store.Tickets.getByUser(session.id);
            const spent = myTickets.reduce((s, t) => s + t.total, 0);
            document.getElementById('resStats').innerHTML = [
                { icon: '🎟', value: myTickets.length, label: 'Tickets Purchased' },
                { icon: '📅', value: [...new Set(myTickets.map(t => t.eventId))].length, label: 'Events Attended' },
                { icon: '💳', value: 'R' + spent.toLocaleString(), label: 'Total Spent', accent: true },
            ].map(s => `
        <div class="stat-card ${s.accent ? 'accent' : ''}">
          <div class="stat-icon">${s.icon}</div>
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>`).join('');
        }

        function renderRecentTickets(session) {
            const tickets = Store.Tickets.getByUser(session.id).reverse().slice(0, 3);
            const el = document.getElementById('recentTickets');
            if (!tickets.length) {
                el.innerHTML = `<div class="admin-empty"><div class="admin-empty-icon">🎟</div><h3>No tickets yet</h3><p>Purchase tickets to upcoming events.</p><a href="html/play.html" class="btn-primary">Browse Events</a></div>`;
                return;
            }
            el.innerHTML = tickets.map(t => `
        <div style="padding:14px 0;border-bottom:1px solid var(--admin-border);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <strong style="font-size:14px;">${t.eventTitle}</strong>
              <div style="font-size:12px;color:var(--admin-muted);margin-top:2px;">${t.tier} · ${t.eventDate}</div>
              <div style="font-size:11px;font-family:monospace;color:var(--admin-muted);margin-top:2px;">${t.id}</div>
            </div>
            <span class="badge ${t.validated ? 'badge-validated' : 'badge-pending'}">${t.validated ? 'Used' : 'Active'}</span>
          </div>
        </div>`).join('');
        }

        function renderUpcomingEvents(session) {
            const events = Store.Events.getPublished().slice(0, 4);
            const el = document.getElementById('upcomingEvents');
            if (!events.length) { el.innerHTML = '<p style="font-size:14px;color:var(--admin-muted);">No events currently published.</p>'; return; }
            el.innerHTML = events.map(e => `
        <div class="upcoming-event-card">
          <img src="${e.image}" alt="${e.title}" class="upcoming-event-img" onerror="this.style.display='none'" />
          <div class="upcoming-event-info">
            <div class="upcoming-event-tag">${e.tag}</div>
            <div class="upcoming-event-title">${e.title}</div>
            <div class="upcoming-event-meta">${e.date} · ${e.time}</div>
            <a href="html/event.html?id=${e.id}" style="font-size:12px;color:var(--orange);text-decoration:none;font-weight:500;display:inline-block;margin-top:4px;">Get Tickets →</a>
          </div>
        </div>`).join('');
        }