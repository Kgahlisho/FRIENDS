(function () {
    var wrap = document.querySelector('body[data-page] .hero-img-placeholder');
    if (!wrap) return;
    var body = document.body, busy = false;
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('aria-label', 'Replay header animation');

    function replay() {
        if (busy) return;
        busy = true;
        body.classList.add('hero-replay');
        void wrap.offsetWidth;                 // force reflow so the animation restarts
        body.classList.remove('hero-replay');
        setTimeout(function () { busy = false; }, 2000);
    }
    wrap.addEventListener('click', replay);
    wrap.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replay(); }
    });
})();
