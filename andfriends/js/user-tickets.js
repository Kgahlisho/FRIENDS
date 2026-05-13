/**
 * &FRIENDS — js/user-tickets.js
 */

(function () { if (!Store.Auth.isLoggedIn()) window.location.href = 'html/index.html'; })();

        let session;

        document.addEventListener('DOMContentLoaded', () => {
            session = Store.Auth.getSession();

            document.getElementById('sidebarUser').innerHTML = `
        <div class="user-avatar">${session.name.charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <div class="user-name">${session.name}</div>
          <div class="user-role" style="color:var(--gold);">Resident</div>
        </div>`;

            renderStats();
            renderTickets();
        });

        function renderStats() {
            const tickets = Store.Tickets.getByUser(session.id);
            const spent = tickets.reduce((s, t) => s + t.total, 0);
            const active = tickets.filter(t => !t.validated).length;

            document.getElementById('ticketStats').innerHTML = [
                { icon: '🎟', value: tickets.length, label: 'Total Tickets' },
                { icon: '✅', value: active, label: 'Active' },
                { icon: '💳', value: 'R' + spent.toLocaleString(), label: 'Total Spent', accent: true },
            ].map(s => `
        <div class="stat-card ${s.accent ? 'accent' : ''}">
          <div class="stat-icon">${s.icon}</div>
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>`).join('');
        }

        function renderTickets() {
            const filter = document.getElementById('filterStatus').value;
            let tickets = Store.Tickets.getByUser(session.id).reverse();

            if (filter === 'active') tickets = tickets.filter(t => !t.validated);
            if (filter === 'used') tickets = tickets.filter(t => t.validated);

            const grid = document.getElementById('ticketGrid');

            if (!tickets.length) {
                grid.innerHTML = `
          <div style="grid-column:1/-1;">
            <div class="admin-empty">
              <div class="admin-empty-icon">🎟</div>
              <h3>${filter === 'all' ? 'No tickets yet' : 'No ' + filter + ' tickets'}</h3>
              <p>Browse upcoming events and secure your spot.</p>
              <a href="html/play.html" class="btn-primary">Browse Events →</a>
            </div>
          </div>`;
                return;
            }

            grid.innerHTML = tickets.map(t => `
        <div class="rf-ticket">
          <div class="rf-ticket-top">
            <div class="rf-ticket-tag">${t.tag}</div>
            <div class="rf-ticket-title">${t.eventTitle}</div>
            <div class="rf-ticket-meta">${t.eventDate} · ${t.eventLocation || '5 De Beer St, Braamfontein'}</div>
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
                    ['Tier', t.tier],
                    ['Qty', t.quantity],
                    ['Total', 'R' + t.total.toLocaleString()],
                    ['ID', t.id],
                ].map(([l, v]) => `
                <div class="rf-detail-row"><span>${l}</span><strong style="font-size:11px;">${v}</strong></div>
              `).join('')}
            </div>
            <div class="rf-qr" id="qr-${t.id}"></div>
          </div>
          <div class="rf-ticket-status ${t.validated ? 'status-used' : 'status-active'}">
            <span><span class="status-dot"></span>${t.validated ? 'Used · ' + new Date(t.validatedAt).toLocaleDateString() : 'Active — Valid for entry'}</span>
            <span style="opacity:.5;">${new Date(t.purchasedAt).toLocaleDateString()}</span>
          </div>
        </div>`).join('');

            // Generate QR codes after DOM update
            setTimeout(() => {
                tickets.forEach(t => {
                    const el = document.getElementById('qr-' + t.id);
                    if (el && !el.querySelector('canvas')) {
                        new QRCode(el, {
                            text: JSON.stringify({ id: t.id, event: t.eventId, user: t.userId }),
                            width: 88, height: 88,
                            colorDark: '#2c1a0e',
                            colorLight: '#fdf6f2',
                            correctLevel: QRCode.CorrectLevel.H
                        });
                    }
                });
            }, 50);
        }