/* About Us page — live visual layer. Progressive enhancement; safe to re-run. */
(function () {
  'use strict';
  if (!document.querySelector('#who-we-are.ab-sec')) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('ab-js');
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- reveal on scroll ---------- */
  var rv = $$('.ab-rv');
  rv.forEach(function (el, i) { if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i % 4); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* ---------- ribbon marquee ---------- */
  var rt = $$('.ab-ribbon-track')[0];
  if (rt && !rt.dataset.dup) { rt.dataset.dup = 1; var h = rt.innerHTML; rt.innerHTML = h + h; }

  /* ---------- quote: words light up as you scroll ---------- */
  var quotes = $$('[data-fill]').map(function (q) {
    var words = q.textContent.trim().split(/\s+/);
    q.setAttribute('aria-label', words.join(' '));
    q.innerHTML = words.map(function (w) { return '<span class="ab-w" aria-hidden="true">' + w + '</span>'; }).join(' ');
    return { el: q, spans: $$('.ab-w', q) };
  });

  /* ---------- scroll: photo parallax + quote fill ---------- */
  var pars = $$('[data-par]'), ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (!reduce) pars.forEach(function (img) {
      var box = img.parentNode.getBoundingClientRect();
      if (box.bottom < -100 || box.top > vh + 100) return;
      var c = box.top + box.height / 2 - vh / 2, f = parseFloat(img.getAttribute('data-par')) || .06;
      img.style.setProperty('--py', Math.max(-40, Math.min(40, c * -f)).toFixed(1) + 'px');
    });
    quotes.forEach(function (q) {
      var r = q.el.getBoundingClientRect();
      var p = reduce ? 1 : Math.max(0, Math.min(1, (vh * .85 - r.top) / (r.height + vh * .3)));
      var n = Math.round(p * q.spans.length * 1.08);
      q.spans.forEach(function (s, i) { s.classList.toggle('on', i < n); });
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();