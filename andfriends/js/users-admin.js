/**
 * &FRIENDS — js/users-admin.js
 */

document.getElementById('sidebarMount').outerHTML = renderAdminSidebar('admin.html');

    document.addEventListener('DOMContentLoaded', () => { renderStats(); renderUsers(); });

    function renderStats() {
      const users = Store.Users.getAll();
      document.getElementById('userStats').innerHTML = [
        { icon: '👥', value: users.length, label: 'Total Users' },
        { icon: '🏠', value: users.filter(u => u.role === 'resident').length, label: 'Residents' },
        { icon: '⚙️', value: users.filter(u => u.role === 'admin').length, label: 'Admins' },
      ].map(s => `
        <div class="stat-card">
          <div class="stat-icon">${s.icon}</div>
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
        </div>`).join('');
    }

    function renderUsers() {
      const search = document.getElementById('userSearch').value.toLowerCase();
      const roleF  = document.getElementById('roleFilter').value;
      let users = Store.Users.getAll();
      if (roleF !== 'all') users = users.filter(u => u.role === roleF);
      if (search) users = users.filter(u => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));

      const wrap = document.getElementById('usersTableWrap');
      if (!users.length) {
        wrap.innerHTML = '<div class="admin-empty"><div class="admin-empty-icon">👥</div><h3>No users found</h3></div>';
        return;
      }

      const session = Store.Auth.getSession();

      wrap.innerHTML = `<table class="admin-table">
        <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Tickets</th><th>Actions</th></tr></thead>
        <tbody>${users.map(u => {
          const ticketCount = Store.Tickets.getAll().filter(t => t.userId === u.id).length;
          const isSelf = session?.id === u.id;
          return `<tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:36px;height:36px;background:var(--dark-brown);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--warm-white);font-family:var(--font-display);font-size:16px;flex-shrink:0;">
                  ${u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>${u.name}</strong>
                  ${isSelf ? '<span style="font-size:10px;background:var(--orange);color:white;padding:1px 6px;border-radius:4px;margin-left:6px;">You</span>' : ''}
                </div>
              </div>
            </td>
            <td style="font-size:13px;">${u.email}</td>
            <td style="font-size:13px;">${u.phone || '–'}</td>
            <td><span class="badge badge-${u.role}">${u.role}</span></td>
            <td style="font-size:12px;color:var(--admin-muted);">${new Date(u.createdAt).toLocaleDateString()}</td>
            <td>${ticketCount}</td>
            <td>
              <div style="display:flex;gap:8px;">
                ${!isSelf ? `
                  <button class="btn-secondary btn-sm" onclick="toggleRole('${u.id}','${u.role}')">
                    ${u.role === 'admin' ? '→ Resident' : '→ Admin'}
                  </button>
                  <button class="btn-icon danger" onclick="deleteUser('${u.id}','${u.name}')">🗑</button>
                ` : '<span style="font-size:12px;color:var(--admin-muted);">–</span>'}
              </div>
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table>`;
    }

    function toggleRole(id, currentRole) {
      const newRole = currentRole === 'admin' ? 'resident' : 'admin';
      Store.Users.updateRole(id, newRole);
      showToast(`User role changed to ${newRole}.`);
      renderUsers();
      renderStats();
    }

    function deleteUser(id, name) {
      adminConfirm(`Delete user "${name}"?`, () => {
        Store.Users.delete(id);
        showToast('User deleted.', 'info');
        renderUsers();
        renderStats();
      });
    }