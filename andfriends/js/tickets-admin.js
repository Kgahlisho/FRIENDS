/**
 * &FRIENDS — js/tickets-admin.js
 */

document.getElementById('sidebarMount').outerHTML = renderAdminSidebar('tickets.html');

        document.addEventListener('DOMContentLoaded', () => {
            populateEventFilter();
            renderStats();
            renderTickets();
        });

        function renderStats() {
            const tickets = Store.Tickets.getAll();
            const revenue = tickets.reduce((s, t) => s + t.total, 0);
            const validated = tickets.filter(t => t.validated).length;
            document.getElementById('ticketStats').innerHTML = [
                { icon: '🎟', value: tickets.length, label: 'Total Sold' },
                { icon: '✅', value: validated, label: 'Validated' },
                { icon: '⏳', value: tickets.length - validated, label: 'Pending' },
                { icon: '💰', value: 'R' + revenue.toLocaleString(), label: 'Revenue', accent: true },
            ].map(s => `
        <div class="stat-card ${s.accent ? 'accent' : ''}">
          <div class="stat-icon">${s.icon}</div>
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>`).join('');
        }

        function populateEventFilter() {
            const sel = document.getElementById('ticketEventFilter');
            const events = [...new Set(Store.Tickets.getAll().map(t => t.eventTitle))];
            events.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e; opt.textContent = e;
                sel.appendChild(opt);
            });
        }

        function renderTickets() {
            const search = document.getElementById('ticketSearch').value.toLowerCase();
            const eventFilter = document.getElementById('ticketEventFilter').value;
            let tickets = Store.Tickets.getAll().reverse();

            if (eventFilter !== 'all') tickets = tickets.filter(t => t.eventTitle === eventFilter);
            if (search) tickets = tickets.filter(t =>
                t.id.toLowerCase().includes(search) ||
                t.userName.toLowerCase().includes(search) ||
                t.eventTitle.toLowerCase().includes(search) ||
                t.userEmail.toLowerCase().includes(search)
            );

            const wrap = document.getElementById('ticketsTableWrap');
            if (!tickets.length) {
                wrap.innerHTML = '<div class="admin-empty"><div class="admin-empty-icon">🎟</div><h3>No tickets found</h3></div>';
                return;
            }

            wrap.innerHTML = `<table class="admin-table">
        <thead><tr>
          <th>Ticket ID</th><th>Buyer</th><th>Event</th><th>Tier</th><th>Qty</th><th>Total</th><th>Status</th><th>Action</th>
        </tr></thead>
        <tbody>${tickets.map(t => `
          <tr>
            <td style="font-family:monospace;font-size:12px;">${t.id}</td>
            <td><strong>${t.userName}</strong><br><small style="color:var(--admin-muted)">${t.userEmail}</small></td>
            <td style="font-size:13px;">${t.eventTitle}<br><small style="color:var(--admin-muted)">${t.eventDate}</small></td>
            <td style="font-size:13px;">${t.tier}</td>
            <td>${t.quantity}</td>
            <td><strong>R${t.total.toLocaleString()}</strong></td>
            <td><span class="badge ${t.validated ? 'badge-validated' : 'badge-pending'}">${t.validated ? 'Used' : 'Pending'}</span></td>
            <td>
              ${!t.validated ? `<button class="btn-secondary btn-sm" onclick="quickValidate('${t.id}')">Validate</button>` : `<span style="font-size:12px;color:var(--admin-muted);">${new Date(t.validatedAt).toLocaleDateString()}</span>`}
            </td>
          </tr>`).join('')}
        </tbody>
      </table>`;
        }

        function quickValidate(id) {
            const r = Store.Tickets.validate(id);
            if (r.ok) { showToast(`Ticket ${id} validated ✓`); renderTickets(); renderStats(); }
            else showToast(r.error, 'error');
        }

        function validateTicket() {
            const id = document.getElementById('validateInput').value.trim().toUpperCase();
            const resultEl = document.getElementById('validateResult');
            if (!id) { resultEl.innerHTML = `<div style="color:var(--danger);font-size:14px;">Please enter a ticket ID.</div>`; return; }

            const ticket = Store.Tickets.getById(id);
            if (!ticket) {
                resultEl.innerHTML = `<div style="background:var(--danger-bg);border-radius:10px;padding:16px;color:var(--danger);">
          <strong>❌ Ticket Not Found</strong><p style="font-size:13px;margin-top:6px;">No ticket with ID "${id}" exists.</p>
        </div>`; return;
            }

            if (ticket.validated) {
                resultEl.innerHTML = `<div style="background:var(--warning-bg);border-radius:10px;padding:16px;color:var(--warning);">
          <strong>⚠️ Already Used</strong>
          <p style="font-size:13px;margin-top:6px;">This ticket was validated on ${new Date(ticket.validatedAt).toLocaleString()}.</p>
          <p style="font-size:13px;">Holder: <strong>${ticket.userName}</strong></p>
        </div>`; return;
            }

            const r = Store.Tickets.validate(id);
            if (r.ok) {
                resultEl.innerHTML = `<div style="background:var(--success-bg);border-radius:10px;padding:16px;color:var(--success);">
          <strong>✅ Valid Ticket</strong>
          <p style="font-size:13px;margin-top:8px;">Holder: <strong>${ticket.userName}</strong></p>
          <p style="font-size:13px;">Event: ${ticket.eventTitle}</p>
          <p style="font-size:13px;">Tier: ${ticket.tier} · Qty: ${ticket.quantity}</p>
          <p style="font-size:13px;margin-top:8px;opacity:.7;">Marked as used.</p>
        </div>`;
                renderTickets(); renderStats();
            }
        }