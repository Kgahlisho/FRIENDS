/**
 * &FRIENDS — admin-core.js
 * Shared utilities for all admin pages: auth guard, sidebar, toasts, modals.
 *
 * Auth guard is deferred: Firebase's onAuthStateChanged fires async,
 * so we wait for the 'af:auth' event before checking isAdmin().
 * A loading overlay hides the page until auth resolves (max 4 s).
 */

// ── Deferred auth guard ─────────────────────────────────────────
(function adminGuard() {

    // Show a loading overlay so the page content isn't visible
    // before we know whether the user is an admin.
    const overlay = document.createElement('div');
    overlay.id = 'adminAuthOverlay';
    overlay.style.cssText =
        'position:fixed;inset:0;background:#1a1008;' +
        'display:flex;align-items:center;justify-content:center;' +
        'z-index:99999;color:#f5e6d0;font-family:sans-serif;font-size:14px;';
    overlay.innerHTML = '<span>Loading…</span>';
    document.body.appendChild(overlay);

    function check() {
        overlay.remove();
        if (!Store.Auth.isAdmin()) {
            window.location.href = 'html/index.html';
        } else {
            // Re-render sidebar user info now that session is confirmed
            renderSidebarUser();
        }
    }

    // If session is already populated (page refresh with valid token), check immediately
    if (Store.Auth.isAdmin()) {
        overlay.remove();
        return;
    }

    // Otherwise wait for Firebase onAuthStateChanged to resolve
    document.addEventListener('af:auth', check, { once: true });

    // Safety timeout: if auth never resolves in 4 s, redirect
    setTimeout(() => {
        if (document.getElementById('adminAuthOverlay')) {
            check();
        }
    }, 4000);

})();

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    renderSidebarUser();
    injectToastContainer();
    highlightActiveNav();
});

// ── Sidebar ─────────────────────────────────────────────────────
function initSidebar() {
    const ham = document.createElement('button');
    ham.className = 'admin-hamburger';
    ham.setAttribute('aria-label', 'Open menu');
    ham.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="3" y1="6"  x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>`;
    document.body.prepend(ham);

    const sidebar = document.querySelector('.admin-sidebar');
    if (!sidebar) return;
    ham.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            e.target !== ham) {
            sidebar.classList.remove('open');
        }
    });
}

function renderSidebarUser() {
    const session = Store.Auth.getSession();
    if (!session) return;
    const el = document.getElementById('sidebarUser');
    if (el) {
        el.innerHTML = `
      <div class="user-avatar">${session.name.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${session.name}</div>
        <div class="user-role">Administrator</div>
      </div>`;
    }
}

function highlightActiveNav() {
    const page = window.location.pathname.split('/').pop();
    document.querySelectorAll('.admin-nav a').forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.includes(page)) a.classList.add('active');
    });
}

function adminLogout() {
    Store.Auth.logout();
    window.location.href = 'html/index.html';
}

// ── Toast system ─────────────────────────────────────────────────
function injectToastContainer() {
    if (document.getElementById('toastContainer')) return;
    const el = document.createElement('div');
    el.id = 'toastContainer';
    el.className = 'toast-container';
    document.body.appendChild(el);
}

function showToast(message, type = 'success') {
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || '·'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ── Modal helpers ────────────────────────────────────────────────
function openAdminModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = 'flex';
    requestAnimationFrame(() => el.classList.add('visible'));
}

function closeAdminModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('visible');
    setTimeout(() => { el.style.display = 'none'; }, 250);
}

document.addEventListener('click', e => {
    if (e.target.classList.contains('admin-modal-backdrop')) {
        e.target.classList.remove('visible');
        setTimeout(() => { e.target.style.display = 'none'; }, 250);
    }
});

// ── Confirm dialog ───────────────────────────────────────────────
function adminConfirm(message, onConfirm) {
    if (document.getElementById('confirmModal')) {
        document.getElementById('confirmModal').remove();
    }
    const el = document.createElement('div');
    el.id = 'confirmModal';
    el.className = 'admin-modal-backdrop';
    el.style.display = 'flex';
    el.innerHTML = `
    <div class="admin-modal" style="max-width:400px;">
      <div class="admin-modal-body" style="padding:32px;text-align:center;">
        <div style="font-size:32px;margin-bottom:12px;">⚠️</div>
        <h3 style="font-size:18px;margin-bottom:10px;color:var(--dark-brown);">${message}</h3>
        <p style="font-size:13px;color:var(--admin-muted);margin-bottom:24px;">
          This action cannot be undone.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button class="btn-secondary"
            onclick="document.getElementById('confirmModal').remove()">Cancel</button>
          <button class="btn-danger"
            onclick="(${onConfirm.toString()})();document.getElementById('confirmModal').remove()">Delete</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
}

// ── File → base64 ────────────────────────────────────────────────
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ── Sidebar HTML template (shared across all admin pages) ────────
function renderAdminSidebar(activePage) {
    const pages = [
        { href: 'dashboard.html',    label: 'Overview',        icon: '📊' },
        { href: 'events.html',       label: 'Events',          icon: '🗓' },
        { href: 'admin_gallery.html',label: 'Gallery',         icon: '🖼' },
        { href: 'admin_content.html',label: 'Website Content', icon: '✏️' },
        { href: 'tickets.html',      label: 'Tickets',         icon: '🎟' },
        { href: 'admin.html',        label: 'Users',           icon: '👥' },
    ];
    return `
    <aside class="admin-sidebar">
      <div class="admin-sidebar-brand">
        <div class="brand-amp">&amp;</div>
        <div class="brand-name">FRIENDS</div>
        <span class="brand-role">Admin Portal</span>
      </div>
      <nav class="admin-nav">
        <div class="admin-nav-section-label">Management</div>
        ${pages.map(p => `
          <a href="${p.href}" class="${p.href === activePage ? 'active' : ''}">
            <span>${p.icon}</span> ${p.label}
          </a>`).join('')}
      </nav>
      <div class="admin-sidebar-footer">
        <div class="admin-sidebar-user" id="sidebarUser"></div>
        <button class="btn-logout" onclick="adminLogout()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log Out
        </button>
      </div>
    </aside>`;
}
