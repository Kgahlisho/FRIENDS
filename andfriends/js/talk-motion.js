/* &FRIENDS — talk-motion.js
   Builds the ripple/echo layer for the &TALK hero animation
   (css/talk-motion.css), splits the title/tagline so they can rise in,
   and replays it when the photo is clicked. */
(function () {
    if (document.documentElement.getAttribute('data-talk') !== 'ripple') return;

    var content = document.querySelector('.hero-content');
    var wrap = document.querySelector('.hero-img-placeholder');
    if (!content || !wrap) return;

    /* ───────────── ripple layer ───────────── */
    var fx = document.createElement('div');
    fx.className = 'talk-fx';
    fx.setAttribute('aria-hidden', 'true');

    // Three concentric rings, staggered — like soundwaves from the photo centre.
    var rings = [
        { cls: 'ring inner', d: '0.00s' },
        { cls: 'ring', d: '0.28s' },
        { cls: 'ring inner', d: '0.56s' }
    ];
    rings.forEach(function (r) {
        var el = document.createElement('span');
        el.className = r.cls;
        el.style.setProperty('--d', r.d);
        fx.appendChild(el);
    });

    content.insertBefore(fx, content.firstChild);

    function place() {
        // The layer fills .hero-content; each ring's 50/50 anchor is nudged
        // so it lands on the photo centre (which may not be the content centre).
        var cw = content.offsetWidth, ch = content.offsetHeight;
        var ww = wrap.offsetWidth, wh = wrap.offsetHeight;
        var wl = wrap.offsetLeft, wt = wrap.offsetTop;

        fx.style.left = '0';
        fx.style.top = '0';
        fx.style.width = cw + 'px';
        fx.style.height = ch + 'px';

        var dx = (wl + ww / 2) - cw / 2;
        var dy = (wt + wh / 2) - ch / 2;
        Array.prototype.forEach.call(fx.children, function (el) {
            el.style.marginLeft = (-50 + (dx / cw) * 100) + '%';
            el.style.marginTop = (-50 + (dy / ch) * 100) + '%';
        });
    }

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
                    sp.className = 'talk-ch';
                    sp.setAttribute('aria-hidden', 'true');
                    sp.textContent = ch;
                    title.appendChild(sp);
                    pieces.push({ el: sp, kind: 'letter' });
                });
            } else if (n.nodeType === 1) {          // the styled "&" span
                n.classList.add('talk-ch', 'amp');
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
            ln.className = 'talk-line';
            ln.setAttribute('aria-hidden', 'true');
            ln.textContent = t;
            tagline.appendChild(ln);
            pieces.push({ el: ln, kind: 'line' });
        });
    }

    function launchText() {
        if (!pieces.length) return;
        textBlock.classList.remove('talk-text-play');
        void textBlock.offsetWidth;   // force a clean layout so delays restart
        var ci = 0, li = 0;
        pieces.forEach(function (p) {
            if (p.kind === 'letter') {
                p.el.style.setProperty('--cd', (0.45 + ci * 0.09).toFixed(2) + 's');
                ci++;
            } else {
                p.el.style.setProperty('--cd', (1.25 + li * 0.14).toFixed(2) + 's');
                li++;
            }
        });
        textBlock.classList.add('talk-text-play');
    }

    function play() {
        place();
        fx.classList.remove('play');
        void fx.offsetWidth;
        fx.classList.add('play');
        launchText();
    }

    play();
    wrap.addEventListener('click', function () { setTimeout(play, 0); });
    wrap.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') setTimeout(play, 0);
    });
    window.addEventListener('resize', place);
})();