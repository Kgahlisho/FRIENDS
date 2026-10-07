
(function () {
    'use strict';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

    function resolve(src) {
        if (!src) return '';
        if (/^(https?:|data:|blob:)/i.test(src)) return src;
        if (src.indexOf('/') > -1) return '../' + src.replace(/^\.?\.?\//, '');
        return '../Resources/' + src;
    }

    /* `Store` is a top-level const (not a window property), so it must be referenced directly */
    function saved(key) {
        try {
            if (typeof Store === 'undefined' || !Store.Content) return {};
            return Store.Content.getSection(key) || {};
        } catch (e) { return {}; }
    }

    ready(function () {
        var svc = document.getElementById('services_home'), com = document.getElementById('community_home');
        if (!svc || !svc.classList.contains('hs-services') || !com) return;
        if (!reduce) document.documentElement.classList.add('hs-js');

        /*  slideshows: each frame cycles through its own photos  */
        var frames = Array.prototype.slice.call(document.querySelectorAll('.hs-frame'));
        var frameDefaults = frames.map(function (f) {
            var d = (f.getAttribute('data-slides') || '').split('|').filter(Boolean);
            if (!d.length) { var im = f.querySelector('img'); if (im) d = [im.getAttribute('src')]; }
            return d;
        });

        function buildFrame(f, n, list) {
            var sig = list.join('|');
            if (f._sig === sig) return;                       // nothing changed, keep the show running
            f._sig = sig;
            var tok = f._tok = (f._tok || 0) + 1;             // cancels the previous loop

            var existing = f.querySelector('img');
            var reuse = existing && existing.getAttribute('src') === resolve(list[0]);
            f.textContent = '';
            list.forEach(function (s, i) {
                if (i === 0 && reuse) { f.appendChild(existing); return; }
                var im = new Image(); im.alt = ''; im.decoding = 'async';
                if (i > 0) im.loading = 'lazy';
                im.src = resolve(s); f.appendChild(im);
            });
            var imgs = f.querySelectorAll('img'), k = 0;
            imgs[0].classList.add('on');
            if (reduce || imgs.length < 2) return;
            setTimeout(function loop() {
                if (f._tok !== tok || !document.body.contains(f)) return;
                if (!document.hidden) { imgs[k].classList.remove('on'); k = (k + 1) % imgs.length; void imgs[k].offsetWidth; imgs[k].classList.add('on'); }
                setTimeout(loop, 4200 + n * 500);
            }, 2600 + n * 900);
        }

        /*  community: arch photo + four polaroids  */
        var arch = com.querySelector('.hs-arch img');
        var pols = [1, 2, 3, 4].map(function (i) {
            var fig = com.querySelector('.hs-p' + i);
            return fig ? { img: fig.querySelector('img'), cap: fig.querySelector('figcaption') } : null;
        });

        function applyContent() {
            var h = saved('hostHome');
            frames.forEach(function (f, n) {
                var l = h['frame' + (n + 1)];
                buildFrame(f, n, (Array.isArray(l) && l.length) ? l : frameDefaults[n]);
            });

            var c = saved('communityHome');
            if (arch) {
                if (c.arch) { var a = resolve(c.arch); if (arch.getAttribute('src') !== a) arch.src = a; }
                if (typeof c.archAlt === 'string') arch.alt = c.archAlt;
            }
            pols.forEach(function (p, i) {
                if (!p) return;
                var n = i + 1;
                if (p.img) {
                    if (c['p' + n]) { var s = resolve(c['p' + n]); if (p.img.getAttribute('src') !== s) p.img.src = s; }
                    if (typeof c['p' + n + 'alt'] === 'string') p.img.alt = c['p' + n + 'alt'];
                }
                if (p.cap && typeof c['p' + n + 'cap'] === 'string') p.cap.textContent = c['p' + n + 'cap'];
            });
        }
        applyContent();
        document.addEventListener('af:content', applyContent);   // admin edits / Firebase fetch -> update live

        /*  reveal on scroll  */
        var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('hs-in'); io.unobserve(e.target); } }); }, { threshold: .15 });
        Array.prototype.forEach.call(svc.querySelectorAll('.hs-copy > *'), function (el, i) { el.style.setProperty('--d', i); io.observe(el); });
        [svc.querySelector('.hs-stage')].concat(Array.prototype.slice.call(com.querySelectorAll('.hs-ctitle, .hs-ctext, .hs-cphotos'))).forEach(function (el, i) { if (el) io.observe(el); });

        /*  scroll depth  */
        if (reduce) return;
        var deep = [[svc.querySelector('.hs-f1'), -.05], [svc.querySelector('.hs-f2'), .06], [svc.querySelector('.hs-f3'), -.08], [com.querySelector('.hs-arch'), -.04]], ticking = false;
        function frame() {
            ticking = false; var vh = window.innerHeight;
            deep.forEach(function (d) { if (!d[0]) return; var r = d[0].getBoundingClientRect(); if (r.bottom < -100 || r.top > vh + 100) return; d[0].style.setProperty('--py', ((r.top + r.height / 2 - vh / 2) * d[1]).toFixed(1) + 'px'); });
        }
        window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true }); frame();
    });
})();