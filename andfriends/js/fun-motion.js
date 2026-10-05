/* ══════════════════════════════════════════════════════════════
   &FUN hero — "Cinematic"
   1. The photo fades up out of the dark while the lens slowly
      pulls back (zoom-out + brightness lift).
   2. A light sweep crosses the photo, left → right.
   3. The moment the light leaves the photo, the photo winds up and
      tilts forward as if throwing: the letters of the title are
      flung out of its edge and land in place, one after another.
   4. The tagline settles once the last letter has landed.
   Everything is timed from the real layout, so the throw works on
   desktop and on stacked mobile layouts alike.
   Click / tap (or Enter / Space) on the photo to replay.
══════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var body = document.body;
    if (!body || body.getAttribute('data-page') !== 'fun') return;

    function ready(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }
    ready(init);

    function init() {
        var hero = document.getElementById('hero');
        var wheel = hero && hero.querySelector('.hero-img-placeholder');   // the photo frame
        var img = wheel && wheel.querySelector('.hero-img');
        var title = hero && hero.querySelector('.hero-title');
        var loc = hero && hero.querySelector('.hero-location');

        var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!wheel || !title || !title.animate || reduce) {
            body.classList.add('fm-off');
            return;
        }

        /* the tagline rests at the opacity set in styles.css (~.55); the hidden
           pre-script state is lifted first so we read the real value */
        body.classList.add('fm-ready');
        var locOpacity = 1;
        if (loc) {
            var lo = parseFloat(getComputedStyle(loc).opacity);
            if (!isNaN(lo) && lo > 0) locOpacity = lo;
        }

        /* ── timeline (ms) ─────────────────────────────────── */
        var PHOTO_DELAY = 120, PHOTO_DUR = 1800;   // photo fades up
        var ZOOM_DUR = 3400;                      // lens pull-back
        var SWEEP_AT = 1100, SWEEP_DUR = 1500;    // light crosses the photo; it ends at E

        /* the throw, measured from E (the moment the light leaves the photo) */
        var WIND_AT = 280,    // photo has leaned back
            FLICK_AT = 600,    // photo is at the peak of its forward tilt
            RECOIL_AT = 1000,   // small rebound
            SETTLE_AT = 1400;   // photo at rest again
        var THROW_AT = 400;    // first letter leaves the photo (just before the flick peak)
        var L_STAG = 120;    // gap between letters
        var L_DUR = 1000;   // each letter's flight
        var LOC_LAG = 520;    // tagline after the last letter leaves

        var EXPO = 'cubic-bezier(.16, 1, .3, 1)';    // long, soft deceleration

        /* ── split the title into letters ──────────────────── */
        var letters = [];
        title.setAttribute('aria-label', title.textContent);
        Array.prototype.slice.call(title.childNodes).forEach(function (n) {
            if (n.nodeType === 3) {
                var frag = document.createDocumentFragment();
                var txt = n.textContent;
                for (var i = 0; i < txt.length; i++) {
                    var c = txt.charAt(i);
                    if (!c.trim()) { frag.appendChild(document.createTextNode(c)); continue; }
                    var s = document.createElement('span');
                    s.className = 'fm-ch fm-gen';
                    s.setAttribute('aria-hidden', 'true');
                    s.textContent = c;
                    frag.appendChild(s);
                    letters.push(s);
                }
                title.replaceChild(frag, n);
            } else if (n.nodeType === 1) {
                n.classList.add('fm-ch');
                n.setAttribute('aria-hidden', 'true');
                letters.push(n);
            }
        });

        /* ── light sweep over the photo ────────────────────── */
        var sweep = document.createElement('div');
        sweep.className = 'fm-sweep';
        sweep.setAttribute('aria-hidden', 'true');
        var band = document.createElement('div');
        band.className = 'fm-band';
        sweep.appendChild(band);
        wheel.appendChild(sweep);

        /* ── measure the real layout ───────────────────────── */
        function measure() {
            var wr = wheel.getBoundingClientRect();
            var W = wheel.offsetWidth;
            var bw = Math.round(W * 0.35);                        // width of the light band
            band.style.width = bw + 'px';

            /* text beside the photo → thrown out of its right edge;
               text stacked below it → thrown out of its bottom edge */
            var firstR = letters[0].getBoundingClientRect();
            var beside = firstR.left >= wr.right - 2;
            var ox = beside ? wr.right - 34 : (wr.left + wr.right) / 2;
            var oy = beside ? null : wr.bottom - 34;

            var throws = letters.map(function (l) {
                var r = l.getBoundingClientRect();
                var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                return {
                    dx: ox - cx,
                    dy: (oy === null ? (wr.top + wr.bottom) / 2 : oy) - cy
                };
            });
            return { W: W, bw: bw, throws: throws };
        }

        /* ── animation lifecycle ───────────────────────────── */
        var anims = [], runId = 0;

        function cancelAnims() {
            anims.forEach(function (a) { try { a.cancel(); } catch (e) { } });
            anims = [];
        }
        function add(el, frames, opts) {
            opts.fill = 'both';
            var a = el.animate(frames, opts);
            anims.push(a);
            return a;
        }
        function r1(n) { return Math.round(n * 10) / 10; }

        function play() {
            cancelAnims();                       // clean slate so measurements are true
            var id = ++runId;
            var M = measure();
            body.classList.add('fm-ready');

            var E = SWEEP_AT + SWEEP_DUR;        // the light has just left the photo

            /* 1 + 3 · the photo frame: fade up, hold, then wind up → flick → settle.
               One animation owns the frame's transform so nothing fights. */
            var t0 = PHOTO_DELAY, total = (E + SETTLE_AT) - t0;
            function f(t) { return (t - t0) / total; }
            var fadeEnd = Math.min(t0 + PHOTO_DUR, E - 60);
            var rest = 'scale(1) rotate(0deg)';
            add(wheel, [
                { offset: 0, opacity: 0, transform: 'scale(.965) rotate(0deg)', easing: EXPO },
                { offset: f(fadeEnd), opacity: 1, transform: rest, easing: 'linear' },
                { offset: f(E), opacity: 1, transform: rest, easing: 'cubic-bezier(.4, 0, .6, 1)' },
                { offset: f(E + WIND_AT), opacity: 1, transform: 'scale(.992) rotate(-4deg)', easing: 'cubic-bezier(.55, 0, .25, 1)' },
                { offset: f(E + FLICK_AT), opacity: 1, transform: 'scale(1.012) rotate(5.5deg)', easing: 'cubic-bezier(.3, .6, .4, 1)' },
                { offset: f(E + RECOIL_AT), opacity: 1, transform: 'scale(1) rotate(-1.4deg)', easing: 'ease-in-out' },
                { offset: 1, opacity: 1, transform: rest }
            ], { duration: total, delay: t0, easing: 'linear' });

            /* 1 · the lens pulls back, exposure lifts */
            if (img) {
                add(img, [
                    { transform: 'scale(1.4)', filter: 'brightness(.45)' },
                    { transform: 'scale(1)', filter: 'brightness(1)' }
                ], { duration: ZOOM_DUR, delay: PHOTO_DELAY, easing: 'cubic-bezier(.25, .46, .2, 1)' });
            }

            /* 2 · light sweep across the photo (constant speed) */
            add(band, [
                { transform: 'translateX(' + (-1.5 * M.bw) + 'px) skewX(-18deg)' },
                { transform: 'translateX(' + (M.W + 0.5 * M.bw) + 'px) skewX(-18deg)' }
            ], { duration: SWEEP_DUR, delay: SWEEP_AT, easing: 'linear' });

            /* 3 · the letters are thrown out of the photo and land in place */
            var lastStart = 0;
            letters.forEach(function (l, i) {
                var T = M.throws[i];
                var start = E + THROW_AT + i * L_STAG;
                lastStart = start;
                add(l, [
                    {
                        offset: 0, opacity: 0, filter: 'blur(10px)',
                        transform: 'translate(' + r1(T.dx) + 'px,' + r1(T.dy) + 'px) rotate(-40deg) scale(.5)'
                    },
                    { offset: .12, opacity: 1 },
                    {
                        offset: .6, filter: 'blur(1px)',
                        transform: 'translate(' + r1(T.dx * .2) + 'px,' + r1(T.dy * .2 - 30) + 'px) rotate(-12deg) scale(.96)'
                    },
                    { offset: 1, opacity: 1, filter: 'blur(0px)', transform: 'translate(0,0) rotate(0deg) scale(1)' }
                ], { duration: L_DUR, delay: start, easing: 'cubic-bezier(.2, .85, .3, 1)' });
            });

            /* 4 · tagline settles after the last letter has left */
            if (loc) {
                add(loc, [
                    { opacity: 0, filter: 'blur(8px)', transform: 'translateY(16px)' },
                    { opacity: locOpacity, filter: 'blur(0px)', transform: 'translateY(0)' }
                ], { duration: 1100, delay: lastStart + LOC_LAG, easing: EXPO });
            }

            /* when everything has finished, hand control back to the stylesheet */
            Promise.all(anims.map(function (a) { return a.finished; })).then(function () {
                if (id === runId) cancelAnims();
            }).catch(function () { });

            return { E: E };
        }

        /* ── replay ────────────────────────────────────────── */
        wheel.setAttribute('tabindex', '0');
        wheel.setAttribute('role', 'button');
        wheel.setAttribute('aria-label', 'Replay header animation');
        wheel.addEventListener('click', play);
        wheel.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
        });

        window.__fmPlay = play;   // handy for testing; harmless in production
        play();
    }
})();