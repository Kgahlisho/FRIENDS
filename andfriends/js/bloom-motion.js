/* &FRIENDS — bloom-motion.js
   Builds the petal layer for the &BLOOM hero animation (css/bloom-motion.css), splits the
   title/tagline so they can fly out of the flower, and replays it when the photo is clicked. */
(function () {
    if (document.documentElement.getAttribute('data-bloom') !== 'petals') return;

    var content = document.querySelector('.hero-content');
    var wrap = document.querySelector('.hero-img-placeholder');
    if (!content || !wrap) return;

    var fx = document.createElement('div');
    fx.className = 'bloom-fx';
    fx.setAttribute('aria-hidden', 'true');

    var petals = document.createElement('div'); petals.className = 'fx-petals';
    var i, el;
    for (i = 0; i < 10; i++) {                                   // outer ring
        el = document.createElement('span'); el.className = 'petal';
        el.style.setProperty('--a', (i * 36) + 'deg'); el.style.setProperty('--d', (i * 0.045) + 's');
        petals.appendChild(el);
    }
    for (i = 0; i < 10; i++) {                                   // inner ring, offset
        el = document.createElement('span'); el.className = 'petal inner';
        el.style.setProperty('--a', (i * 36 + 18) + 'deg'); el.style.setProperty('--d', (0.25 + i * 0.04) + 's');
        petals.appendChild(el);
    }
    el = document.createElement('span'); el.className = 'pistil'; petals.appendChild(el);

    fx.appendChild(petals);
    content.insertBefore(fx, content.firstChild);

    function place() {           // centre the layer on the photo; petals extend well past its frame
        // offset* = layout size, unaffected by the photo's in-flight scale/rotate
        var ww = wrap.offsetWidth, wh = wrap.offsetHeight, wl = wrap.offsetLeft, wt = wrap.offsetTop;
        var w = ww * 1.9, h = wh * 1.35;
        fx.style.width = w + 'px'; fx.style.height = h + 'px';
        fx.style.left = (wl + ww / 2 - w / 2) + 'px';
        fx.style.top = (wt + wh / 2 - h / 2) + 'px';
    }
    /* ── Text that flies out of the flower ───────────────────
       Title: every letter becomes its own element. Tagline: every line does.
       On each play we measure how far each piece sits from the flower's centre
       (the middle of the photo) and launch it from there on a curved path. */
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
                    sp.className = 'bloom-ch'; sp.setAttribute('aria-hidden', 'true'); sp.textContent = ch;
                    title.appendChild(sp); pieces.push({ el: sp, kind: 'letter' });
                });
            } else if (n.nodeType === 1) {                       // the styled "&" span
                n.classList.add('bloom-ch', 'amp'); n.setAttribute('aria-hidden', 'true');
                title.appendChild(n); pieces.push({ el: n, kind: 'letter' });
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
            ln.className = 'bloom-line'; ln.setAttribute('aria-hidden', 'true'); ln.textContent = t;
            tagline.appendChild(ln); pieces.push({ el: ln, kind: 'line' });
        });
    }

    function launchText() {
        if (!pieces.length) return;
        textBlock.classList.remove('bloom-text-play');
        pieces.forEach(function (p) { p.el.style.removeProperty('--dx'); });
        void textBlock.offsetWidth;                               // clean layout, nothing transformed
        var cr = content.getBoundingClientRect();
        var cx = cr.left + wrap.offsetLeft + wrap.offsetWidth / 2;    // flower centre (layout position)
        var cy = cr.top + wrap.offsetTop + wrap.offsetHeight / 2;
        var li = 0, ci = 0;
        pieces.forEach(function (p) {
            var r = p.el.getBoundingClientRect();
            var dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
            p.el.style.setProperty('--dx', dx.toFixed(1) + 'px');
            p.el.style.setProperty('--dy', dy.toFixed(1) + 'px');
            if (p.kind === 'letter') {
                p.el.style.setProperty('--rot', (ci % 2 ? 1 : -1) * (150 + ci * 25) + 'deg');
                p.el.style.setProperty('--cd', (0.55 + ci * 0.11).toFixed(2) + 's'); ci++;
            } else {
                p.el.style.setProperty('--cd', (1.35 + li * 0.13).toFixed(2) + 's'); li++;
            }
        });
        textBlock.classList.add('bloom-text-play');
    }

    function play() { place(); fx.classList.remove('play'); void fx.offsetWidth; fx.classList.add('play'); launchText(); }

    play();
    wrap.addEventListener('click', function () { setTimeout(play, 0); });
    wrap.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') setTimeout(play, 0); });
    window.addEventListener('resize', place);
})();
