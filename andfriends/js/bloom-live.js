/* &FRIENDS — bloom page, sections below the hero. */
(function () {
    // soft light that follows the pointer inside the format tiles
    Array.prototype.forEach.call(document.querySelectorAll('.bl-tile'), function (el) {
        el.addEventListener('pointermove', function (e) {
            var r = el.getBoundingClientRect();
            el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    });

    // featured collaborations: one panel open at a time (hover, tap, focus or arrow keys)
    var panels = Array.prototype.slice.call(document.querySelectorAll('.bl-panel'));
    var canHover = window.matchMedia('(hover: hover)').matches;
    function open(p) {
        panels.forEach(function (x) {
            var on = x === p;
            x.classList.toggle('is-active', on);
            x.setAttribute('aria-expanded', on ? 'true' : 'false');
        });
    }
    panels.forEach(function (p, i) {
        p.addEventListener('click', function () { open(p); });
        p.addEventListener('focus', function () { open(p); });
        if (canHover) p.addEventListener('mouseenter', function () { open(p); });
        p.addEventListener('keydown', function (e) {
            var k = e.key;
            if (k === 'ArrowRight' || k === 'ArrowDown') { panels[(i + 1) % panels.length].focus(); e.preventDefault(); }
            else if (k === 'ArrowLeft' || k === 'ArrowUp') { panels[(i - 1 + panels.length) % panels.length].focus(); e.preventDefault(); }
            else if (k === 'Enter' || k === ' ') { open(p); e.preventDefault(); }
        });
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // gentle parallax on the framed print and the full-bleed photo
    var layers = Array.prototype.slice.call(document.querySelectorAll('[data-bl-par]'));
    if (!layers.length) return;
    var ticking = false;

    function update() {
        ticking = false;
        var vh = window.innerHeight;
        layers.forEach(function (el) {
            var r = el.parentNode.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            var p = (r.top + r.height / 2 - vh / 2) / vh;      // -1 … 1 across the viewport
            el.style.setProperty('--py', (p * -parseFloat(el.getAttribute('data-bl-par'))).toFixed(1) + 'px');
        });
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
})();