/* Events page — live visual layer (progressive enhancement). */
(function () {
  'use strict';
  if (!document.querySelector('.pl-vibe')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('pl-js');
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var timers = [];

  /* reel loops seamlessly */
  $$('.pl-reel-track').forEach(function (t) {
    if (t.dataset.dup) return; t.dataset.dup = 1;
    $$('figure', t).forEach(function (f) { t.appendChild(f.cloneNode(true)); });
  });

  /* quiet crossfade in the intro frame */
  var fr = $('.pl-frame');
  if (fr && !reduce) {
    var imgs = $$('img', fr), k = 0;
    timers.push(setInterval(function () {
      if (!document.body.contains(fr)) return;
      imgs[k].classList.remove('on'); k = (k + 1) % imgs.length; imgs[k].classList.add('on');
    }, 5200));
  }

  /* index rows: preview image follows the cursor */
  var peek = $('.pl-peek'), pimg = peek && $('img', peek), rows = $$('.pl-row');
  if (peek && window.matchMedia('(hover: hover) and (min-width: 901px)').matches) {
    var tx = 0, ty = 0, x = 0, y = 0, raf = null;
    function loop() {
      x += (tx - x) * .14; y += (ty - y) * .14;
      peek.style.transform = 'translate3d(' + (x + 30) + 'px,' + (y - 165) + 'px,0)';
      raf = requestAnimationFrame(loop);
    }
    rows.forEach(function (r) {
      r.addEventListener('mouseenter', function (e) {
        pimg.src = r.getAttribute('data-img'); tx = x = e.clientX; ty = y = e.clientY;
        peek.classList.add('show'); if (!raf) raf = requestAnimationFrame(loop);
      });
      r.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
      r.addEventListener('mouseleave', function () {
        peek.classList.remove('show'); cancelAnimationFrame(raf); raf = null;
      });
    });
  }

  /* scroll-in */
  var els = $$('.pl-eyebrow, .pl-h2, .pl-intro-copy p, .pl-frame, .pl-row, .pl-quote, .pl-quote-sub, .pl-loop-t, .pl-orbit');
  els.forEach(function (e, i) { e.classList.add('pl-rv'); e.style.setProperty('--i', i % 4); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .1, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (e) { io.observe(e); });
  } else els.forEach(function (e) { e.classList.add('in'); });

  window.addEventListener('pagehide', function () { timers.forEach(clearInterval); });
})();