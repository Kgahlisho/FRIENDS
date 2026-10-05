/* &FRIENDS — music-motion.js
   Builds the equalizer layer for the &MUSIC hero animation
   (css/music-motion.css), splits the title/tagline so they can tune in,
   and replays the whole drop when the photo is clicked.
   Bars are driven by a per-frame JS loop: bell envelope + slow travelling
   wave + small global jitter, with per-bar temporal smoothing so the
   motion reads smooth instead of twitchy. */
(function () {
    if (document.documentElement.getAttribute('data-music') !== 'eq') return;

    var content = document.querySelector('.hero-content');
    var wrap = document.querySelector('.hero-img-placeholder');
    if (!content || !wrap) return;

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ───────────── equalizer layer ───────────── */
    var fx = document.createElement('div');
    fx.className = 'eq-fx';
    fx.setAttribute('aria-hidden', 'true');

    var bars = document.createElement('div');
    bars.className = 'eq-bars';

    var BAR_COUNT = 28;
    var barEls = [];
    var barState = [];              // smoothed current height per bar (0..1.35)

    function envelope(i, n) {
        var t = i / (n - 1);
        var s = Math.sin(Math.PI * t);
        return 0.12 + 0.88 * Math.pow(s, 1.8);
    }

    for (var i = 0; i < BAR_COUNT; i++) {
        var el = document.createElement('span');
        el.className = 'bar' + (i % 3 === 1 ? ' alt' : '');
        el.style.setProperty('--env', envelope(i, BAR_COUNT).toFixed(3));
        bars.appendChild(el);
        barEls.push(el);
        barState.push(0.2);
    }

    fx.appendChild(bars);
    content.insertBefore(fx, content.firstChild);

    function place() {
        fx.style.width = content.offsetWidth + 'px';
        fx.style.height = content.offsetHeight + 'px';
        fx.style.left = '0';
        fx.style.top = '0';
    }

    /* ───────────── per-frame bar animation ───────────── */
    var phase = 0;
    var seed = Math.random() * 1000;
    var amp = 0.55;              // idle starting amplitude
    var last = performance.now();
    var rafId = null;

    // Exponential-smoothing factor: 0 = never move, 1 = snap instantly.
    // ~0.14 at 60fps feels like a slow gliding wave.
    var SMOOTH = 0.14;

    function tick(now) {
        var dt = (now - last) / 1000;
        last = now;
        if (dt > 0.1) dt = 0.1;
        phase += dt;

        // amp eases slowly toward idle — click-spike decays gracefully
        amp += (0.55 - amp) * Math.min(1, dt * 0.9);

        // one shared global jitter per frame — everything breathes together
        var gj = Math.sin(phase * 1.7) * 0.06 + (Math.random() - 0.5) * 0.04;

        // normalise smoothing for frame-rate independence
        var k = 1 - Math.pow(1 - SMOOTH, dt * 60);

        for (var j = 0; j < BAR_COUNT; j++) {
            var env = envelope(j, BAR_COUNT);

            // two slow, out-of-phase travelling waves
            var w1 = Math.sin(phase * 1.4 + j * 0.55 + seed);
            var w2 = Math.sin(phase * 3.2 + j * 0.31 + seed * 1.7);

            // tiny per-bar phase wobble so bars don't sync exactly
            var wobble = Math.sin(phase * 0.9 + j * 1.9) * 0.04;

            var target =
                0.62 +
                0.24 * w1 +
                0.14 * w2 +
                gj +
                wobble;

            // clamp inside a safe range
            if (target < 0.08) target = 0.08;
            if (target > 1.25) target = 1.25;

            // scale by envelope and by amp
            target = env * target * (0.75 + 0.5 * amp);
            if (target < 0.04) target = 0.04;
            if (target > 1.35) target = 1.35;

            // ease toward target — this is what makes it smooth
            barState[j] += (target - barState[j]) * k;

            barEls[j].style.transform =
                'scaleY(' + barState[j].toFixed(3) + ')';
        }

        rafId = requestAnimationFrame(tick);
    }

    function startLoop() {
        if (reduceMotion) {
            for (var j = 0; j < BAR_COUNT; j++) {
                barEls[j].style.transform = 'scaleY(' +
                    (envelope(j, BAR_COUNT) * 0.7).toFixed(3) + ')';
            }
            return;
        }
        if (rafId !== null) return;
        last = performance.now();
        rafId = requestAnimationFrame(tick);
    }

    function stopLoop() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stopLoop();
        else startLoop();
    });

    /* ───────────── split text into animatable pieces ───────────── */
    var title = document.querySelector('.hero-title');
    var tagline = document.querySelector('.hero-location');
    var textBlock = document.querySelector('.hero-text-block');
    var pieces = [];

    if (title && tagline && textBlock) {
        title.setAttribute('aria-label', title.textContent.trim());
        var nodes = Array.prototype.slice.call(title.childNodes);
        title.textContent = '';
        nodes.forEach(function (n) {
            if (n.nodeType === 3) {
                n.textContent.split('').forEach(function (ch) {
                    if (!ch.trim()) return;
                    var sp = document.createElement('span');
                    sp.className = 'eq-ch';
                    sp.setAttribute('aria-hidden', 'true');
                    sp.textContent = ch;
                    title.appendChild(sp);
                    pieces.push({ el: sp, kind: 'letter' });
                });
            } else if (n.nodeType === 1) {
                n.classList.add('eq-ch', 'amp');
                n.setAttribute('aria-hidden', 'true');
                title.appendChild(n);
                pieces.push({ el: n, kind: 'letter' });
            }
        });

        var label = tagline.textContent.replace(/\s+/g, ' ').trim();
        var lines = [], buf = [];
        Array.prototype.slice.call(tagline.childNodes).forEach(function (n) {
            if (n.nodeName === 'BR') { lines.push(buf.join(' ')); buf = []; }
            else if (n.nodeType === 3) { buf.push(n.textContent.replace(/\s+/g, ' ').trim()); }
        });
        lines.push(buf.join(' '));
        tagline.setAttribute('aria-label', label);
        tagline.textContent = '';
        lines.filter(Boolean).forEach(function (t) {
            var ln = document.createElement('span');
            ln.className = 'eq-line';
            ln.setAttribute('aria-hidden', 'true');
            ln.textContent = t;
            tagline.appendChild(ln);
            pieces.push({ el: ln, kind: 'line' });
        });
    }

    function launchText() {
        if (!pieces.length) return;
        textBlock.classList.remove('eq-text-play');
        void textBlock.offsetWidth;
        var ci = 0, li = 0, letters = pieces.filter(function (p) { return p.kind === 'letter'; });
        var total = letters.length || 1;
        pieces.forEach(function (p) {
            if (p.kind === 'letter') {
                var jx = (ci % 2 ? 1 : -1) * (14 + (ci % 4) * 6);
                p.el.style.setProperty('--jx', jx + 'px');
                p.el.style.setProperty('--cd', (0.55 + (ci / total) * 0.7).toFixed(2) + 's');
                ci++;
            } else {
                p.el.style.setProperty('--cd', (1.45 + li * 0.14).toFixed(2) + 's');
                li++;
            }
        });
        textBlock.classList.add('eq-text-play');
    }

    function play() {
        place();
        amp = 1.2;              // punch the amplitude; it eases back down
        launchText();
        var ph = wrap, img = wrap.querySelector('.hero-img');
        if (ph) {
            ph.style.animation = 'none';
            void ph.offsetWidth;
            ph.style.animation = '';
        }
        if (img) {
            img.style.animation = 'none';
            void img.offsetWidth;
            img.style.animation = '';
        }
    }

    place();
    startLoop();
    play();

    wrap.addEventListener('click', function () { setTimeout(play, 0); });
    wrap.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') setTimeout(play, 0);
    });
    window.addEventListener('resize', place);
})();