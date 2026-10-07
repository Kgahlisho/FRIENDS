/* &FRIENDS — site-persist.js
   Keeps the music playing while visitors move between pages.
   While the player is open (see music-player.js) clicks on links to other public pages are loaded in the
   background and swapped in, instead of reloading the whole browser page — the player bar (and the song in
   it) is never torn down. When the player is closed, links behave exactly as normal.
   If anything goes wrong during a swap it falls back to a normal page load. */
(function () {
    'use strict';
    if (window.AFNav) return;

    var enabled = false, shownUrl = location.href, busy = false, tracked = [];
    var LIBS = /firebase-config|firebase-store|\/auth\.js|site-persist|gstatic\.com|cdnjs\.|qrcode/;   // run once per visit, never re-run
    var KEEP_CSS = /music-player\.css/;                                                                      // the player's own styles stay on every page
    var KEEP = '.mp-bar, #authModal';                                                                  // body elements that survive a swap

    function dirOf(u) { return new URL('.', u).href; }
    function eligible(a, e) {
        if (!enabled || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
        if (a.target && a.target !== '_self' || a.hasAttribute('download')) return null;
        var u; try { u = new URL(a.href, location.href); } catch (x) { return null; }
        if (u.origin !== location.origin || !/\.html$/i.test(u.pathname)) return null;
        if (dirOf(u.href) !== dirOf(location.href)) return null;                                    // only the public /html/ pages
        if (u.pathname === location.pathname && u.search === location.search) return null;           // same page / #anchor: default behaviour
        return u;
    }

    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
        var u = eligible(a, e); if (!u) return;
        e.preventDefault(); go(u.href, true);
    });
    window.addEventListener('popstate', function () {
        if (location.href.split('#')[0] === shownUrl.split('#')[0]) return;
        if (!enabled) { location.reload(); return; }
        go(location.href, false);
    });

    function go(url, push) {
        if (busy) return; busy = true;
        swap(url, push).catch(function (err) {
            if (window.console) console.warn('[site-persist] falling back to normal navigation', err);
            location.href = url;
        }).then(function () { busy = false; });
    }

    function key(el, base) { return new URL(el.getAttribute('href'), base).href; }

    function swap(url, push) {
        return fetch(url, { credentials: 'same-origin' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status); return r.text();
        }).then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            if (!doc.body) throw new Error('no body');

            /* 1. stylesheets: add the ones this page needs, wait for them */
            var wanted = Array.prototype.map.call(doc.querySelectorAll('head link[rel="stylesheet"]'), function (l) { return key(l, url); });
            var have = {}; Array.prototype.forEach.call(document.head.querySelectorAll('link[rel="stylesheet"]'), function (l) { have[l.href] = l; });
            var loads = [], prev = null;
            wanted.forEach(function (h) {
                if (have[h]) { prev = have[h]; return; }
                var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h;
                loads.push(new Promise(function (res) { l.onload = l.onerror = res; setTimeout(res, 4000); }));
                if (prev && prev.nextSibling) prev.parentNode.insertBefore(l, prev.nextSibling); else document.head.appendChild(l);
                have[h] = l; prev = l;
            });
            return Promise.all(loads).then(function () { return { doc: doc, wanted: wanted, have: have }; });
        }).then(function (c) {
            var doc = c.doc;
            /* 2. grab the script sources before we change anything */
            var scripts = Array.prototype.filter.call(doc.querySelectorAll('script'), function (s) {
                var src = s.getAttribute('src'); return src ? !LIBS.test(src) : true;
            });
            var texts = Promise.all(scripts.map(function (s) {
                var src = s.getAttribute('src');
                return src ? fetch(new URL(src, url).href).then(function (r) { return r.text(); }) : Promise.resolve(s.textContent);
            }));
            return texts.then(function (t) { c.texts = t; return c; });
        }).then(function (c) {
            var doc = c.doc;
            /* 3. undo the previous page's global listeners, drop its inline styles / stale stylesheets */
            tracked.forEach(function (t) { t[0].removeEventListener(t[1], t[2], t[3]); }); tracked = [];
            Array.prototype.forEach.call(document.head.querySelectorAll('style'), function (s) { if (!s.hasAttribute('data-keep')) s.remove(); });
            Object.keys(c.have).forEach(function (h) { if (c.wanted.indexOf(h) < 0 && !KEEP_CSS.test(h)) c.have[h].remove(); });
            Array.prototype.forEach.call(doc.querySelectorAll('head style'), function (s) { document.head.appendChild(document.importNode(s, true)); });
            document.title = doc.title || document.title;

            /* 4. swap <html>/<body> attributes and content; keep the player and auth modal */
            Array.prototype.slice.call(document.documentElement.attributes).forEach(function (a) { if (a.name !== 'lang' || !doc.documentElement.hasAttribute('lang')) document.documentElement.removeAttribute(a.name); });
            Array.prototype.forEach.call(doc.documentElement.attributes, function (a) { document.documentElement.setAttribute(a.name, a.value); });
            var open = document.body.classList.contains('mp-open');
            Array.prototype.slice.call(document.body.attributes).forEach(function (a) { document.body.removeAttribute(a.name); });
            Array.prototype.forEach.call(doc.body.attributes, function (a) { document.body.setAttribute(a.name, a.value); });
            if (open) document.body.classList.add('mp-open');
            var keep = Array.prototype.slice.call(document.body.children).filter(function (n) { return n.matches(KEEP); });
            Array.prototype.slice.call(document.body.children).forEach(function (n) { if (keep.indexOf(n) < 0) n.remove(); });
            Array.prototype.slice.call(doc.body.children).forEach(function (n) {
                if (n.tagName === 'SCRIPT' || n.matches(KEEP)) return;
                document.body.insertBefore(document.importNode(n, true), keep[0] || null);
            });
            if (push) history.pushState({ afpj: 1 }, '', url);
            shownUrl = url;
            var hash = new URL(url).hash;
            window.scrollTo(0, 0);

            /* 5. re-run this page's own scripts as if it had just loaded */
            var queued = [], realDoc = document.addEventListener, realWin = window.addEventListener;
            function patch(target, orig, isWin) {
                return function (type, fn, opt) {
                    if (type === 'DOMContentLoaded' || (isWin && type === 'load')) { queued.push(fn); return; }
                    tracked.push([target, type, fn, opt]); return orig.call(target, type, fn, opt);
                };
            }
            document.addEventListener = patch(document, realDoc, false);
            window.addEventListener = patch(window, realWin, true);
            try {
                c.texts.forEach(function (code, i) {
                    try { (0, eval)(code + '\n//# sourceURL=' + (scripts_src(c, i) || 'inline-' + i)); } catch (err) { console.error('[site-persist] script error', err); }
                });
            } finally { delete document.addEventListener; delete window.addEventListener; }
            queued.forEach(function (fn) { try { var r = fn.call(document, new Event('DOMContentLoaded')); if (r && r.catch) r.catch(function (e) { console.error(e); }); } catch (err) { console.error(err); } });
            try { if (typeof injectAccountButton === 'function') { injectAccountButton(); updateNav(); } } catch (err) { }
            if (hash) { var t = document.getElementById(hash.slice(1)); if (t) t.scrollIntoView(); }
            document.dispatchEvent(new CustomEvent('af:pagechange', { detail: { url: url } }));
        });
    }
    function scripts_src(c, i) { return null; }

    window.AFNav = { enable: function () { enabled = true; }, disable: function () { enabled = false; } };
})();
