/**
 * &FRIENDS — js/user-profile.js
 */

(function () { if (!Store.Auth.isLoggedIn()) window.location.href = 'html/index.html'; })();

        let session;

        document.addEventListener('DOMContentLoaded', () => {
            session = Store.Auth.getSession();
            populateProfile();

            document.getElementById('sidebarUser').innerHTML = `
        <div class="user-avatar">${session.name.charAt(0).toUpperCase()}</div>
        <div class="user-info">
          <div class="user-name">${session.name}</div>
          <div class="user-role" style="color:var(--gold);">Resident</div>
        </div>`;
        });

        function populateProfile() {
            const users = JSON.parse(localStorage.getItem('af_users') || '[]');
            const user = users.find(u => u.id === session.id);
            if (!user) return;

            document.getElementById('profileAvatar').textContent = user.name.charAt(0).toUpperCase();
            document.getElementById('profileName').textContent = user.name;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profileJoined').textContent = 'Member since ' + new Date(user.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' });

            document.getElementById('pName').value = user.name;
            document.getElementById('pEmail').value = user.email;
            document.getElementById('pPhone').value = user.phone || '';
            document.getElementById('pDob').value = user.dob || '';
        }

        function saveProfile() {
            const name = document.getElementById('pName').value.trim();
            const phone = document.getElementById('pPhone').value.trim();
            const dob = document.getElementById('pDob').value;
            if (!name) { alert('Name is required.'); return; }

            Store.Users.updateProfile(session.id, { name, phone, dob });
            session = Store.Auth.getSession();
            populateProfile();

            const banner = document.getElementById('profileSuccess');
            banner.style.display = 'block';
            setTimeout(() => banner.style.display = 'none', 3000);
        }

        function changePassword() {
            const pw = document.getElementById('pNewPw').value;
            const pw2 = document.getElementById('pNewPw2').value;
            const err = document.getElementById('pwError');

            err.style.display = 'none';
            if (!pw || !pw2) { err.textContent = 'Please fill in both fields.'; err.style.display = 'block'; return; }
            if (pw.length < 8) { err.textContent = 'Password must be at least 8 characters.'; err.style.display = 'block'; return; }
            if (pw !== pw2) { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; return; }

            Store.Users.updateProfile(session.id, { password: pw });
            document.getElementById('pNewPw').value = '';
            document.getElementById('pNewPw2').value = '';

            const banner = document.getElementById('pwSuccess');
            banner.style.display = 'block';
            setTimeout(() => banner.style.display = 'none', 3000);
        }

        function deleteAccount() {
            if (!confirm('Are you sure? This will permanently delete your account and all ticket data.')) return;
            Store.Users.delete(session.id);
            Store.Auth.logout();
            window.location.href = 'html/index.html';
        }