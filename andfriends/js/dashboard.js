/**
 * &FRIENDS — js/dashboard.js
 */

document.getElementById('sidebarMount').outerHTML = renderAdminSidebar('dashboard.html');

    document.addEventListener('DOMContentLoaded', () => {
      renderStats();
      renderRecentEvents();
      renderRecentTickets();
    });

    function renderStats() {
      const events  = Store.Events.getAll();
      const tickets = Store.Tickets.getAll();
      const users   = Store.Users.getAll();
      const gallery = Store.Gallery.getAll();
      const revenue = tickets.reduce((sum, t) => sum + t.total, 0);

      document.getElementById('statsGrid').innerHTML = [
        { icon: '🗓', value: events.filter(e => e.status === 'published').length, label: 'Published Events', accent: false },
        { icon: '🎟', value: tickets.length, label: 'Tickets Sold', accent: false },
        { icon: '👥', value: users.filter(u => u.role === 'resident').length, label: 'Residents', accent: false },
        { icon: '💰', value: 'R' + revenue.toLocaleString(), label: 'Total Revenue', accent: true },
        { icon: '🖼', value: Store.Gallery.getPublished().length, label: 'Gallery Campaigns', accent: false },
        { icon: '📝', value: events.filter(e => e.status === 'draft').length, label: 'Draft Events', accent: false },
      ].map(s => `
        <div class="stat-card ${s.accent ? 'accent' : ''}">
          <div class="stat-icon">${s.icon}</div>
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>`).join('');
    }

    function renderRecentEvents() {
      const events = Store.Events.getAll().slice(-5).reverse();
      const el = document.getElementById('recentEvents');
      if (!events.length) { el.innerHTML = '<div class="admin-empty"><p>No events yet.</p></div>'; return; }
      el.innerHTML = `<table class="admin-table">
        <thead><tr><th>Event</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>${events.map(e => `
          <tr>
            <td><strong>${e.title}</strong><br><small style="color:var(--admin-muted)">${e.tag}</small></td>
            <td style="font-size:13px">${e.date}</td>
            <td><span class="badge badge-${e.status}">${e.status}</span></td>
          </tr>`).join('')}</tbody>
      </table>`;
    }

    function renderRecentTickets() {
      const tickets = Store.Tickets.getAll().slice(-5).reverse();
      const el = document.getElementById('recentTickets');
      if (!tickets.length) { el.innerHTML = '<div class="admin-empty"><p>No ticket sales yet.</p></div>'; return; }
      el.innerHTML = `<table class="admin-table">
        <thead><tr><th>Buyer</th><th>Event</th><th>Total</th></tr></thead>
        <tbody>${tickets.map(t => `
          <tr>
            <td><strong>${t.userName}</strong><br><small style="color:var(--admin-muted)">${t.id}</small></td>
            <td style="font-size:13px">${t.eventTitle}</td>
            <td><strong>R${t.total.toLocaleString()}</strong></td>
          </tr>`).join('')}</tbody>
      </table>`;
    }