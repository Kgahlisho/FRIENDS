/* Services page — live visual layer. Progressive enhancement; safe to re-run. */
(function () {
  'use strict';
  if (!document.querySelector('.sv-jump')) return;

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  root.classList.add('sv-js');
  var timers = [];
  function alive(el) { return document.body.contains(el); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function every(fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; }


  /* ---------- reveal on scroll ---------- */
  var rvEls = $$('.sv-offer, .sp-rv');
  rvEls.forEach(function (el, i) {
    el.classList.add('sv-rv');
    if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', (i % 4));
  });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rvEls.forEach(function (el) { io.observe(el); });
  } else rvEls.forEach(function (el) { el.classList.add('in'); });

  /* ---------- hero: floating photos + crossfade ---------- */
  var hero = $('#hero');
  var R = '../Resources/';
  if (hero && !reduce) {
    var chips = [
      ['Gallery.jpeg', '6%', '30%', '110px', '-6deg', 0],
      ['Creative space.jpg', '93%', '24%', '120px', '5deg', 0],
      ['Photo-by-Nani-Vercetti-1.jpg', '90%', '74%', '100px', '-4deg', 1],
      ['1E6A6485-2.jpg', '4%', '82%', '96px', '7deg', 1],
      ['kr3aysbgelhgvpxwhy5a.webp', '52%', '94%', '90px', '-8deg', 1],
      ['Images.jpg', '72%', '17%', '84px', '4deg', 1]
    ];
    var orbit = document.createElement('div');
    orbit.className = 'sv-orbit';
    orbit.setAttribute('aria-hidden', 'true');
    chips.forEach(function (c, i) {
      var d = document.createElement('div');
      d.className = 'sv-chip' + (c[5] ? ' hide-sm' : '');
      d.style.cssText = '--x:' + c[1] + ';--y:' + c[2] + ';--s:' + c[3] + ';--r:' + c[4] + ';--d:' + (6 + i * .8) + 's;--dl:-' + i + 's;--in:' + (.3 + i * .15) + 's';
      d.innerHTML = '<div><img loading="lazy" alt="" src="' + R + c[0] + '"></div>';
      orbit.appendChild(d);
    });
    hero.insertBefore(orbit, hero.firstChild);

    var ph = $('.hero-img-placeholder', hero);
    if (ph) {
      ph.style.position = 'relative';
      ph.style.overflow = 'hidden';
      var base = $('img', ph);
      var list = ['316132.jpg', 'Gallery.jpeg', 'Photo-by-Nani-Vercetti-1.jpg'];
      var slides = list.map(function (f) {
        var im = document.createElement('img');
        im.className = 'sv-slide'; im.alt = ''; im.src = R + f; im.loading = 'lazy';
        ph.appendChild(im); return im;
      });
      var k = -1;
      var step = function () {
        if (!alive(ph)) return;
        slides.forEach(function (s) { s.classList.remove('on'); });
        k = (k + 1) % (slides.length + 1);
        if (k < slides.length) { void slides[k].offsetWidth; slides[k].classList.add('on'); }
      };
      every(step, 5200);
    }
  }

  /* ---------- count-up ---------- */
  $$('[data-count]').forEach(function (b) {
    var to = +b.getAttribute('data-count');
    if (reduce || !('IntersectionObserver' in window)) return;
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      o.disconnect();
      var t0 = performance.now(), dur = 1400;
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        b.textContent = Math.round(to * e);
        if (p < 1 && alive(b)) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: .6 });
    o.observe(b);
  });

  /* ---------- marquees: duplicate so -50% loops seamlessly ---------- */
  var pt = $('.sv-people-track');
  if (pt && !pt.dataset.dup) {
    pt.dataset.dup = 1;
    $$('.sv-person', pt).forEach(function (p) {
      var c = p.cloneNode(true); c.setAttribute('aria-hidden', 'true');
      pt.appendChild(c);
    });
  }
  var rt = $('.sp-ribbon-track');
  if (rt && !rt.dataset.dup) {
    rt.dataset.dup = 1;
    var h = rt.innerHTML; rt.innerHTML = h + h;
  }

  /* ---------- venue photo reel ---------- */
  var reel = $('.sp-reel-track');
  if (reel && !reel.dataset.dup) {
    reel.dataset.dup = 1;
    $$('.sp-frame', reel).forEach(function (f) {
      var c = f.cloneNode(true); c.setAttribute('aria-hidden', 'true');
      reel.appendChild(c);
    });
  }

  /* ---------- expanding category gallery ---------- */
  var panels = $$('.sp-panel'), acc = $('.sp-acc');
  var pcur = 0, phold = false, pvis = false, PDUR = 6500;
  function openPanel(p) {
    panels.forEach(function (q, i) {
      var on = q === p;
      q.classList.toggle('is-on', on);
      q.setAttribute('aria-expanded', on ? 'true' : 'false');
      if (on) pcur = i;
    });
  }
  function wide() { return window.matchMedia('(min-width: 901px)').matches; }
  panels.forEach(function (p, i) {
    p.addEventListener('click', function () { openPanel(p); });
    p.addEventListener('focus', function () { openPanel(p); });
    p.addEventListener('mouseenter', function () {
      if (window.matchMedia('(hover: hover) and (min-width: 901px)').matches) openPanel(p);
    });
    p.addEventListener('keydown', function (e) {
      var k = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0);
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(p); return; }
      if (!k) return;
      e.preventDefault();
      var n = panels[(i + k + panels.length) % panels.length];
      n.focus(); openPanel(n);
    });
  });
  if (acc && panels.length) {
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { acc.addEventListener(ev, function () { phold = true; }, { passive: true }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { acc.addEventListener(ev, function () { phold = false; }); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { pvis = es[0].isIntersecting; }, { threshold: .4 }).observe(acc);
    }
    if (!reduce) {
      every(function () {
        if (!alive(acc) || phold || !pvis || !wide()) return;
        openPanel(panels[(pcur + 1) % panels.length]);
      }, PDUR);
    }
  }

  /* ---------- booking story: big number follows the step in view ---------- */
  var storyEl = $('.sp-steps'), stepEls = $$('.sp-step'), big = $('#spBig'), meter = $('#spMeter'), cnt = $('#spCount');
  var lastStep = -1;
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tl() {
    if (!storyEl || !stepEls.length || !alive(storyEl)) return;
    var vh = window.innerHeight, mid = vh * .5, best = 0, bd = 1e9;
    stepEls.forEach(function (s, i) {
      var r = s.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bd) { bd = d; best = i; }
    });
    var sr = storyEl.getBoundingClientRect();
    var p = Math.max(0, Math.min(1, (mid - sr.top) / sr.height));
    if (meter) meter.style.setProperty('--p', Math.max(.06, p).toFixed(3));
    if (best === lastStep) return;
    lastStep = best;
    stepEls.forEach(function (s, i) { s.classList.toggle('is-on', i === best); });
    if (cnt) cnt.textContent = 'Step ' + pad(best + 1) + ' / ' + pad(stepEls.length);
    if (big) {
      var sp = big.querySelector('span'); if (sp) sp.textContent = pad(best + 1);
      big.classList.remove('swap'); void big.offsetWidth;
      if (!reduce) big.classList.add('swap');
    }
  }

  /* ---------- jump bar ---------- */
  var jump = $('.sv-jump'), links = $$('a[href^="#"]', jump);
  var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      var t = targets[i]; if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.innerHeight * .35, cur2 = -1;
      targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < y) cur2 = i; });
      links.forEach(function (a, i) {
        a.classList.toggle('on', i === cur2);
        if (i === cur2 && jump.scrollWidth > jump.clientWidth) jump.scrollTo({ left: a.offsetLeft - 60, behavior: 'auto' });
      });
      tl();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- cleanup if page is swapped ---------- */
  window.addEventListener('pagehide', function () { timers.forEach(clearInterval); });
})();