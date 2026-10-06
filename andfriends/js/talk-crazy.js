/* &FRIENDS — talk-crazy.js  ("Mic Drop")  — builds the effects layer and splits the text for css/talk-crazy.css.
   Needs  <html data-talk="crazy">.  Click / tap / Enter / Space on the photo replays it. */
(function () {
    'use strict';
    if (document.documentElement.getAttribute('data-talk') !== 'crazy') return;
    function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }
    ready(function () {
        var body = document.body;
        var content = document.querySelector('#hero .hero-content');
        var wrap = document.querySelector('#hero .hero-img-placeholder');
        var title = document.querySelector('#hero .hero-title');
        var tagline = document.querySelector('#hero .hero-location');
        if (!content || !wrap || !title || !tagline) { body.classList.add('tc-ready'); return; }

        /* split the title into letters and the tagline into characters (readers still get the full text) */
        title.setAttribute('aria-label', title.textContent.trim());
        var letters = [], chars = [];
        var nodes = Array.prototype.slice.call(title.childNodes); title.textContent = '';
        nodes.forEach(function (n) {
            if (n.nodeType === 3) n.textContent.split('').forEach(function (c) {
                if (!c.trim()) return;
                var s = document.createElement('span'); s.className = 'tc-ch'; s.setAttribute('aria-hidden', 'true'); s.textContent = c; title.appendChild(s); letters.push(s);
            });
            else if (n.nodeType === 1) { n.classList.add('tc-ch', 'amp'); n.setAttribute('aria-hidden', 'true'); title.appendChild(n); letters.push(n); }
        });
        var tag = tagline.textContent.replace(/\s+/g, ' ').trim();
        tagline.setAttribute('aria-label', tag); tagline.textContent = '';
        tag.split('').forEach(function (c) {
            var s = document.createElement('span'); s.className = 'tc-chr'; s.setAttribute('aria-hidden', 'true'); s.textContent = c; tagline.appendChild(s); chars.push(s);
        });

        /* effects layer */
        var fx = document.createElement('div'); fx.className = 'tc-fx'; fx.setAttribute('aria-hidden', 'true'); content.appendChild(fx);
        function r(a, b) { return a + Math.random() * (b - a); }
        function add(cls, text) { var e = document.createElement('span'); e.className = cls; if (text) e.textContent = text; fx.appendChild(e); return e; }

        var WORDS = ['Real talk', 'Panels', 'Healing', 'Ideas', 'Truth', 'Voices', 'Stories'];
        var COLS = ['#f9cfd0', '#ffe3a3', '#cfe8d5', '#cdd9f5', '#e4d0f0', '#fbd0b0', '#f6c1d4'];

        function build() {
            fx.innerHTML = '';
            var ww = wrap.offsetWidth, wh = wrap.offsetHeight, cx = wrap.offsetLeft + ww / 2, cy = wrap.offsetTop + wh / 2, base = wrap.offsetTop + wh;
            var air = add('tc-air', 'ON AIR'); air.style.left = (wrap.offsetLeft + 14) + 'px'; air.style.top = (wrap.offsetTop + 14) + 'px';
            for (var i = 0; i < 3; i++) {                                   /* shockwave rings on the ground */
                var ring = add('tc-ring'); ring.style.left = cx + 'px'; ring.style.top = (base - 6) + 'px'; ring.style.width = (ww * .7) + 'px'; ring.style.setProperty('--d', (i * 0.12) + 's');
            }
            for (i = 0; i < 24; i++) {                                      /* confetti from the impact */
                var c = add('tc-conf'), a = r(-Math.PI * .95, -Math.PI * .05), d = r(ww * .35, ww * .95);
                c.style.left = (cx + r(-ww * .3, ww * .3)) + 'px'; c.style.top = (base - 10) + 'px';
                c.style.setProperty('--c', COLS[i % COLS.length]); c.style.setProperty('--x', Math.cos(a) * d + 'px'); c.style.setProperty('--y', Math.sin(a) * d * .9 + 'px');
                c.style.setProperty('--r', r(-540, 540) + 'deg'); c.style.setProperty('--d', r(0, .12).toFixed(2) + 's');
            }
            var angles = [-160, -118, -72, -28, 150, 108, 62];             /* bubbles avoid the title side where possible */
            WORDS.forEach(function (w, k) {
                var b = add('tc-bubble', w), ang = angles[k] * Math.PI / 180, dist = Math.max(ww, wh) * r(.5, .68);
                b.style.left = cx + 'px'; b.style.top = cy + 'px';
                b.style.setProperty('--c', COLS[k % COLS.length]); b.style.setProperty('--x', Math.cos(ang) * dist * (ww / Math.max(ww, wh) + .35) + 'px');
                b.style.setProperty('--y', Math.sin(ang) * dist * .8 + 'px'); b.style.setProperty('--r', r(-14, 14) + 'deg'); b.style.setProperty('--d', (k * 0.1).toFixed(2) + 's');
            });
        }

        function play() {
            body.classList.remove('tc-play'); void body.offsetWidth;
            build();
            letters.forEach(function (el, i) { el.style.setProperty('--cd', (1.35 + i * 0.15).toFixed(2) + 's'); el.style.setProperty('--rot', (i % 2 ? 22 : -22) + 'deg'); });
            var t0 = 1.35 + letters.length * 0.15 + 0.35;
            chars.forEach(function (el, i) { el.style.setProperty('--cd', (t0 + i * 0.045).toFixed(3) + 's'); });
            body.classList.add('tc-ready'); body.classList.add('tc-play');
        }
        play();
        var busy = false;
        function replay() { if (busy) return; busy = true; play(); setTimeout(function () { busy = false; }, 3600); }
        wrap.setAttribute('tabindex', '0'); wrap.setAttribute('role', 'button'); wrap.setAttribute('aria-label', 'Replay header animation');
        wrap.addEventListener('click', replay);
        wrap.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay(); } });
        window.addEventListener('resize', function () { if (!busy) build(); });
    });
})();
