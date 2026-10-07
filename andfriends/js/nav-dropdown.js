
(function () {
    'use strict';
    var SECTIONS = [['talk.html', 'Talk'], ['fun.html', 'Fun'], ['music.html', 'Music'], ['bloom.html', 'Bloom']];

    if (!document.getElementById('nav-drop-css')) {
        var st = document.createElement('style'); st.id = 'nav-drop-css'; st.setAttribute('data-keep', '');
        st.textContent =
            '.nav-pill .nav-drop{position:relative;display:inline-flex;align-items:center}' +
            '.nav-pill .nav-drop>a::after{content:"";display:inline-block;margin-left:7px;width:5px;height:5px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:translateY(-2px) rotate(45deg);transition:transform .25s}' +
            '.nav-pill .nav-drop:hover>a::after,.nav-pill .nav-drop:focus-within>a::after{transform:translateY(1px) rotate(225deg)}' +
            '.nav-pill .nav-drop-menu{position:absolute;top:100%;left:50%;min-width:168px;padding-top:14px;transform:translate(-50%,-6px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .22s ease,transform .22s ease,visibility 0s linear .22s;z-index:1200}' +
            '.nav-pill .nav-drop:hover .nav-drop-menu,.nav-pill .nav-drop:focus-within .nav-drop-menu{opacity:1;visibility:visible;pointer-events:auto;transform:translate(-50%,0);transition-delay:0s}' +
            '.nav-pill .nav-drop-card{display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(253,246,242,.96);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid var(--pink-mid,#e8c4bc);border-radius:22px;box-shadow:0 18px 40px rgba(199,106,74,.22),0 2px 8px rgba(44,26,14,.08)}' +
            '.nav-pill .nav-drop-menu a{display:flex;align-items:center;gap:2px;padding:9px 16px;border-radius:14px;font-size:.78rem;letter-spacing:.1em;white-space:nowrap;background:transparent;color:var(--dark-brown,#2c1a0e)}' +
            '.nav-pill .nav-drop-menu a .amp{color:var(--orange,#e85d04);font-weight:700;transition:color .2s}' +
            '.nav-pill .nav-drop-menu a:hover,.nav-pill .nav-drop-menu a:focus-visible{background:var(--dark-brown,#2c1a0e);color:var(--warm-white,#fdf6f2);outline:none}' +
            '.nav-pill .nav-drop-menu a:hover .amp,.nav-pill .nav-drop-menu a:focus-visible .amp{color:#ff8a3d}' +
            '.nav-pill .nav-drop-menu a[aria-current="page"]{background:var(--pink-light,#f5ddd8)}' +
            '@media (prefers-reduced-motion:reduce){.nav-pill .nav-drop-menu,.nav-pill .nav-drop>a::after{transition:none}}';
        document.head.appendChild(st);
    }

    function build() {
        var pill = document.querySelector('.nav-pill');
        if (!pill || pill.querySelector('.nav-drop')) return;
        var events = Array.prototype.filter.call(pill.querySelectorAll(':scope > a'), function (a) { return /^\s*events\s*$/i.test(a.textContent); })[0];
        if (!events) return;
        var wrap = document.createElement('div'); wrap.className = 'nav-drop';
        events.parentNode.insertBefore(wrap, events); wrap.appendChild(events);
        events.setAttribute('aria-haspopup', 'true');
        var menu = document.createElement('div'); menu.className = 'nav-drop-menu';
        var card = document.createElement('div'); card.className = 'nav-drop-card'; card.setAttribute('role', 'menu'); menu.appendChild(card);
        var here = location.pathname.split('/').pop().toLowerCase();
        SECTIONS.forEach(function (s) {
            var a = document.createElement('a'); a.href = s[0]; a.setAttribute('role', 'menuitem');
            var amp = document.createElement('span'); amp.className = 'amp'; amp.textContent = '&';
            a.appendChild(amp); a.appendChild(document.createTextNode(s[1]));
            if (here === s[0]) a.setAttribute('aria-current', 'page');
            card.appendChild(a);
        });
        wrap.appendChild(menu);
        wrap.addEventListener('keydown', function (e) { if (e.key === 'Escape') { var f = document.activeElement; if (f && wrap.contains(f)) f.blur(); } });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
