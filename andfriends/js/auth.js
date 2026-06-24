/**
 * &FRIENDS — auth.js
 * Auth modal UI, nav account button, login/register handlers.
 *
 * getSession() is now SYNCHRONOUS (reads the cache in firebase-store.js).
 * The nav button is refreshed whenever the 'af:auth' event fires
 * (emitted by firebase-store after onAuthStateChanged resolves).
 */

// Run as soon as possible — don't wait for DOMContentLoaded
// because the nav pill is already in the HTML.
(function initAuth() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _boot);
    } else {
        _boot();
    }
})();

function _boot() {
    injectAuthModal();
    injectAccountButton();
    updateNav();

    // Re-render nav whenever Firebase resolves the auth state
    document.addEventListener('af:auth', () => updateNav());
    document.addEventListener('af:requireAuth', () => openAuthModal('login'));
}

// ─────────────────────────────────────────────
// NAV ACCOUNT BUTTON
// ─────────────────────────────────────────────
function injectAccountButton() {
    const pill = document.querySelector('.nav-pill');
    if (!pill) return;
    if (document.getElementById('navAccountWrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'nav-account-wrap';
    wrap.id = 'navAccountWrap';
    pill.appendChild(wrap);
}

function updateNav() {
    // Ensure the wrapper exists (in case nav renders late)
    if (!document.getElementById('navAccountWrap')) {
        injectAccountButton();
    }

    const wrap = document.getElementById('navAccountWrap');
    if (!wrap) return;

    // getSession() is SYNCHRONOUS — reads the in-memory cache
    const session = Store.Auth.getSession();

    if (!session) {
        wrap.innerHTML = `
      <button class="nav-account-btn" onclick="openAuthModal('login')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Account
      </button>`;
        return;
    }

    // Resolve dashboard link based on depth of current page
    const isInHtmlFolder = window.location.pathname.includes('/html/');
    const dashLink = session.role === 'admin'
        ? (isInHtmlFolder ? '../dashboard.html' : 'dashboard.html')
        : (isInHtmlFolder ? '../user_dashboard.html' : 'user_dashboard.html');

    const label = session.role === 'admin' ? 'Admin' : 'Dashboard';

    wrap.innerHTML = `
    <div class="nav-user-pill">
      <div class="nav-avatar">${session.name.charAt(0).toUpperCase()}</div>
      <span class="nav-user-name">${session.name.split(' ')[0]}</span>
      <div class="nav-user-dropdown">
        <a href="${dashLink}">${label} →</a>
        <button onclick="handleLogout()">Log Out</button>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
// AUTH ACTIONS
// ─────────────────────────────────────────────
async function handleLogout() {
    await Store.Auth.logout();
    window.location.reload();
}

// ─────────────────────────────────────────────
// MODAL CONTROL
// ─────────────────────────────────────────────
function openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('visible'));
    switchAuthTab(tab);
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.remove('visible');
    setTimeout(() => {
        modal.style.display = 'none';
        clearAuthErrors();
    }, 300);
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab-btn')
        .forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.auth-panel')
        .forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
}

function clearAuthErrors() {
    document.querySelectorAll('.auth-error').forEach(e => {
        e.textContent = '';
        e.style.display = 'none';
    });
    document.querySelectorAll('.auth-input').forEach(i => i.classList.remove('error'));
}

function showAuthError(panelId, msg) {
    const el = document.querySelector(`#${panelId} .auth-error`);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    clearAuthErrors();

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showAuthError('loginPanel', 'Please fill in all fields.');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

    const result = await Store.Auth.login(email, password);

    if (btn) { btn.disabled = false; btn.textContent = 'Log In →'; }

    if (!result.ok) {
        showAuthError('loginPanel', result.error);
        return;
    }

    closeAuthModal();
    redirectAfterAuth(result.user);
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
async function handleRegister(e) {
    e.preventDefault();
    clearAuthErrors();

    const name       = document.getElementById('regName').value.trim();
    const email      = document.getElementById('regEmail').value.trim();
    const password   = document.getElementById('regPassword').value;
    const password2  = document.getElementById('regPassword2').value;
    const phone      = document.getElementById('regPhone').value.trim();
    const dob        = document.getElementById('regDob').value;
    const role       = document.getElementById('regRole').value;
    const adminCode  = document.getElementById('regAdminCode')?.value.trim() || '';

    if (!name || !email || !password || !password2) {
        showAuthError('registerPanel', 'Please fill in all required fields.');
        return;
    }
    if (password.length < 8) {
        showAuthError('registerPanel', 'Password must be at least 8 characters.');
        return;
    }
    if (password !== password2) {
        showAuthError('registerPanel', 'Passwords do not match.');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Creating account…'; }

    const result = await Store.Auth.register({ name, email, password, phone, dob, role, adminCode });

    if (btn) { btn.disabled = false; btn.textContent = 'Create Account →'; }

    if (!result.ok) {
        showAuthError('registerPanel', result.error);
        return;
    }

    closeAuthModal();
    redirectAfterAuth(result.user);
}

// ─────────────────────────────────────────────
// REDIRECT
// ─────────────────────────────────────────────
function redirectAfterAuth(user) {
    updateNav();
    const isInHtmlFolder = window.location.pathname.includes('/html/');
    if (user.role === 'admin') {
        window.location.href = isInHtmlFolder ? '../dashboard.html' : 'dashboard.html';
    } else {
        window.location.href = isInHtmlFolder ? '../user_dashboard.html' : 'user_dashboard.html';
    }
}

// ─────────────────────────────────────────────
// ROLE TOGGLE
// ─────────────────────────────────────────────
function onRoleChange() {
    const role = document.getElementById('regRole').value;
    const wrap = document.getElementById('adminCodeWrap');
    if (wrap) wrap.style.display = role === 'admin' ? 'block' : 'none';
}

// ─────────────────────────────────────────────
// INJECT MODAL
// ─────────────────────────────────────────────
function injectAuthModal() {
    if (document.getElementById('authModal')) return;

    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal-backdrop';
    modal.style.display = 'none';
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');

    modal.innerHTML = `
    <div class="auth-modal">
      <button class="auth-modal-close" onclick="closeAuthModal()" aria-label="Close">✕</button>

      <div class="auth-modal-brand">
        <span class="auth-brand-amp">&amp;</span>FRIENDS
      </div>

      <div class="auth-tabs">
        <button class="auth-tab-btn active" data-tab="login"
          onclick="switchAuthTab('login')">Log In</button>
        <button class="auth-tab-btn" data-tab="register"
          onclick="switchAuthTab('register')">Sign Up</button>
      </div>

      <!-- LOGIN -->
      <div class="auth-panel active" data-panel="login" id="loginPanel">
        <form onsubmit="handleLogin(event)" novalidate>
          <div class="auth-field">
            <label>Email Address</label>
            <input type="email" id="loginEmail" class="auth-input"
              placeholder="you@example.com" required />
          </div>
          <div class="auth-field">
            <label>Password</label>
            <input type="password" id="loginPassword" class="auth-input"
              placeholder="Your password" required />
          </div>
          <div class="auth-error" style="display:none;"></div>
          <button type="submit" class="auth-submit-btn">Log In →</button>
        </form>
        <p class="auth-switch-text">
          No account yet?
          <a href="#" onclick="switchAuthTab('register'); return false;">Create one →</a>
        </p>
      </div>

      <!-- REGISTER -->
      <div class="auth-panel" data-panel="register" id="registerPanel">
        <form onsubmit="handleRegister(event)" novalidate>
          <div class="auth-field">
            <label>Full Name *</label>
            <input type="text" id="regName" class="auth-input"
              placeholder="Your full name" required />
          </div>
          <div class="auth-field">
            <label>Email *</label>
            <input type="email" id="regEmail" class="auth-input"
              placeholder="you@example.com" required />
          </div>
          <div class="auth-field">
            <label>Password *</label>
            <input type="password" id="regPassword" class="auth-input"
              placeholder="Min. 8 characters" required />
          </div>
          <div class="auth-field">
            <label>Confirm Password *</label>
            <input type="password" id="regPassword2" class="auth-input"
              placeholder="Repeat password" required />
          </div>
          <div class="auth-field">
            <label>Phone</label>
            <input type="tel" id="regPhone" class="auth-input"
              placeholder="+27 ··· ··· ····" />
          </div>
          <div class="auth-field">
            <label>Date of Birth</label>
            <input type="date" id="regDob" class="auth-input" />
          </div>
          <div class="auth-field">
            <label>Account Type *</label>
            <select id="regRole" class="auth-input" onchange="onRoleChange()">
              <option value="resident">Resident</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="auth-field" id="adminCodeWrap" style="display:none;">
            <label>Admin Access Code</label>
            <input type="text" id="regAdminCode" class="auth-input"
              placeholder="Organisation code" />
          </div>
          <div class="auth-error" style="display:none;"></div>
          <button type="submit" class="auth-submit-btn">Create Account →</button>
        </form>
        <p class="auth-switch-text">
          Already have an account?
          <a href="#" onclick="switchAuthTab('login'); return false;">Log in →</a>
        </p>
      </div>
    </div>`;

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeAuthModal(); });
}
