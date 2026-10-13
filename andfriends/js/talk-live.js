/* &TALK page — live visual layer (progressive enhancement). */
(function () {
  'use strict';
  if (!document.querySelector('.tk-feel')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('tk-js');
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  var t = document.querySelector('.tk-feel-track');
  if (t && !t.dataset.dup) { t.dataset.dup = 1; var h = t.innerHTML; t.innerHTML = h + h; }

  var els = $$('.tk-eyebrow, .tk-h2, .tk-cols p, .tk-photo, .tk-feel-t, .tk-link, .tk-echo, .tk-soon-t, .tk-host-h, .tk-host-in p, .tk-btn');
  els.forEach(function (e, i) { e.classList.add('tk-rv'); e.style.setProperty('--i', i % 3); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .1, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (e) { io.observe(e); });
  } else els.forEach(function (e) { e.classList.add('in'); });

  /* gentle parallax on the two photos */
  var pars = $$('.tk-photo-in img, .tk-feel-bg'), tick = false;
  function par() {
    tick = false;
    pars.forEach(function (im) {
      var box = im.parentNode.getBoundingClientRect(), c = box.top + box.height / 2 - window.innerHeight / 2;
      var k = im.classList.contains('tk-feel-bg') ? .08 : .06;
      im.style.setProperty('--py', Math.max(-40, Math.min(40, c * -k)).toFixed(1) + 'px');
    });
  }
  if (!reduce) {
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(par); } }, { passive: true });
    window.addEventListener('resize', par); par();
  }
})();