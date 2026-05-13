//   &FRIENDS — main.js

document.addEventListener('DOMContentLoaded', () => {

    // Mobile Navigation Toggle
       const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileClose = document.querySelector('.mobile-nav-close');

    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => {
            mobileNav.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    }

    if (mobileClose && mobileNav) {
        mobileClose.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
        });
    }

    document.querySelectorAll('.mobile-nav a').forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // Active Nav Link on Scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-pill a');

    const updateActiveNav = () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', updateActiveNav);

    // Scroll Reveal
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));

    // Stagger gallery + community grid children
    document.querySelectorAll('.gallery-grid, .community-grid').forEach(grid => {
        grid.querySelectorAll(':scope > *').forEach((child, i) => {
            if (!child.classList.contains('reveal')) {
                child.classList.add('reveal');
                child.dataset.delay = i * 100;
                observer.observe(child);
            }
        });
    });

    // Poster cards — stagger reveal on scroll
    const posterCards = document.querySelectorAll('.poster-card');

    const posterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 100);
                posterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    posterCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
        posterObserver.observe(card);
    });

    // Gallery hover tilt
    document.querySelectorAll('.gallery-item').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.02)`;
            card.style.transition = 'transform 0.1s ease';
            card.style.zIndex = '2';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.4s ease';
            card.style.zIndex = '';
        });
    });

    // Parallax on hero
    const heroContent = document.querySelector('.hero-content');
    const heroAmp = document.querySelector('.hero-ampersand');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (heroContent) heroContent.style.transform = `translateY(${scrollY * 0.2}px)`;
        if (heroAmp) heroAmp.style.transform = `translateY(${scrollY * 0.1}px)`;
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

 // Gallery button
    const galleryBtn = document.querySelector('.gallery-btn-wrap');
    if (galleryBtn) {
        galleryBtn.addEventListener('click', () => { window.location.href = 'gallery.html'; });
    }

    // Hero title reveal
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        heroTitle.style.opacity = '1';
        heroTitle.style.animation = 'none';
        heroTitle.style.clipPath = 'inset(0 100% 0 0)';
        setTimeout(() => {
            heroTitle.style.transition = 'clip-path 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s';
            heroTitle.style.clipPath = 'inset(0 0% 0 0)';
        }, 100);
    }

    console.log('&FRIENDS — site loaded ✓');
});