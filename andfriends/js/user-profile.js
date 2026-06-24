/**
 * &FRIENDS — js/user-profile.js
 * Deferred auth guard — waits for Firebase onAuthStateChanged before checking session.
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

let session;
let currentUser;

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (Store.Auth.isLoggedIn()) {
        _bootProfile();
    } else {
        document.addEventListener('af:auth', () => {
            if (Store.Auth.isLoggedIn()) _bootProfile();
        }, { once: true });
    }
});

async function _bootProfile() {
    session = Store.Auth.getSession();
    if (!session) return;

    // Sidebar
    const sidebarUser = document.getElementById('sidebarUser');
    if (sidebarUser) {
        sidebarUser.innerHTML = `
      <div class="user-avatar">${session.name.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${session.name}</div>
        <div class="user-role" style="color:var(--gold);">Resident</div>
      </div>`;
    }

    // Load full profile from Firestore
    try {
        await Store.Users.fetchAll();
        currentUser = Store.Users.getById(session.id) || {
            name: session.name,
            email: session.email,
            phone: '',
            dob: '',
            createdAt: new Date().toISOString(),
        };
    } catch (_) {
        currentUser = {
            name: session.name,
            email: session.email,
            phone: '',
            dob: '',
            createdAt: new Date().toISOString(),
        };
    }

    renderProfileHeader(currentUser);
    fillForm(currentUser);
}

// ─────────────────────────────────────────────
// RENDER HEADER
// ─────────────────────────────────────────────
function renderProfileHeader(user) {
    const avatarEl = document.getElementById('profileAvatar');
    const nameEl   = document.getElementById('profileName');
    const emailEl  = document.getElementById('profileEmail');
    const joinedEl = document.getElementById('profileJoined');

    if (avatarEl) avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
    if (nameEl)   nameEl.textContent   = user.name || '';
    if (emailEl)  emailEl.textContent  = user.email || '';
    if (joinedEl) joinedEl.textContent = 'Member since ' +
        new Date(user.createdAt || Date.now()).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' });
}

// ─────────────────────────────────────────────
// FILL FORM
// ─────────────────────────────────────────────
function fillForm(user) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('pName',  user.name);
    set('pEmail', user.email);
    set('pPhone', user.phone);
    set('pDob',   user.dob);
}

// ─────────────────────────────────────────────
// SAVE PROFILE
// ─────────────────────────────────────────────
async function saveProfile() {
    const name  = document.getElementById('pName')?.value.trim();
    const phone = document.getElementById('pPhone')?.value.trim();
    const dob   = document.getElementById('pDob')?.value;

    if (!name) { alert('Name is required.'); return; }

    try {
        await Store.Users.updateProfile(session.id, { name, phone, dob });
        session = Store.Auth.getSession();
        currentUser = { ...currentUser, name, phone, dob };
        renderProfileHeader(currentUser);
        showBanner('profileSuccess');
    } catch (err) {
        alert('Failed to save profile: ' + err.message);
    }
}

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────
async function changePassword() {
    const pw  = document.getElementById('pNewPw')?.value;
    const pw2 = document.getElementById('pNewPw2')?.value;
    const errEl = document.getElementById('pwError');

    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

    if (!pw || !pw2)   { showError('pwError', 'Please fill in both fields.'); return; }
    if (pw.length < 8) { showError('pwError', 'Password must be at least 8 characters.'); return; }
    if (pw !== pw2)    { showError('pwError', 'Passwords do not match.'); return; }

    try {
        await Store.Users.updateProfile(session.id, { password: pw });
        document.getElementById('pNewPw').value  = '';
        document.getElementById('pNewPw2').value = '';
        showBanner('pwSuccess');
    } catch (err) {
        showError('pwError', err.message || 'Password change failed.');
    }
}

// ─────────────────────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────────────────────
async function deleteAccount() {
    if (!confirm('Are you sure? This will permanently delete your account.')) return;
    try {
        await Store.Users.delete(session.id);
        await Store.Auth.logout();
        window.location.href = 'html/index.html';
    } catch (err) {
        alert('Failed to delete account: ' + err.message);
    }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function showBanner(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

window.saveProfile   = saveProfile;
window.changePassword = changePassword;
window.deleteAccount = deleteAccount;
