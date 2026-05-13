/**
 * &FRIENDS — index-page.js
 * Loads admin-managed content into the homepage.
 * Renders dynamic events in the poster grid section.
 * Called only on index.html.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadSiteContent();
  renderHomepageEvents();
  loadFooter();
});

function loadFooter() {
  const c = Store.Content.getSection('contact');
  if (!c) return;
  const ph = document.getElementById('footerPhone');
  const em = document.getElementById('footerEmail');
  if (ph) ph.textContent = 'Call Us: ' + c.phone;
  if (em) { em.textContent = 'Email Us: ' + c.email; em.href = 'mailto:' + c.email; }
}

function loadSiteContent() {
  const c = Store.Content.get();
  if (!c) return;

  // Hero
  if (c.hero) {
    const heroHeadEl = document.querySelector('.hero-heading, .hero h1, [data-content="hero-headline"]');
    const heroSubEl  = document.querySelector('.hero-sub, .hero p, [data-content="hero-subtext"]');
    const heroImgEl  = document.querySelector('.hero-bg, .hero-img, [data-content="hero-image"]');
    if (heroHeadEl && c.hero.headline) heroHeadEl.textContent = c.hero.headline;
    if (heroSubEl  && c.hero.subtext)  heroSubEl.textContent  = c.hero.subtext;
    if (heroImgEl  && c.hero.image)    heroImgEl.src = c.hero.image;
  }

  // About / Corner
  if (c.about) {
    const bodyEl = document.querySelector('[data-content="about-body"]');
    const imgEl  = document.querySelector('[data-content="about-image"]');
    if (bodyEl && c.about.body)  bodyEl.textContent = c.about.body;
    if (imgEl  && c.about.image) imgEl.src = c.about.image;
  }

  // Talk
  if (c.talk) {
    const bodyEl = document.querySelector('[data-content="talk-body"]');
    const imgEl  = document.querySelector('[data-content="talk-image"]');
    if (bodyEl && c.talk.body)  bodyEl.textContent = c.talk.body;
    if (imgEl  && c.talk.image) imgEl.src = c.talk.image;
  }

  // Food
  if (c.food) {
    const bodyEl  = document.querySelector('[data-content="food-body"]');
    const quoteEl = document.querySelector('[data-content="food-quote"]');
    const chefEl  = document.querySelector('[data-content="food-chef"]');
    const imgEl   = document.querySelector('[data-content="food-image"]');
    if (bodyEl  && c.food.body)  bodyEl.textContent  = c.food.body;
    if (quoteEl && c.food.quote) quoteEl.textContent = c.food.quote;
    if (chefEl  && c.food.chef)  chefEl.textContent  = '— ' + c.food.chef;
    if (imgEl   && c.food.image) imgEl.src = c.food.image;
  }

  // Music
  if (c.music) {
    const bodyEl = document.querySelector('[data-content="music-body"]');
    const imgEl  = document.querySelector('[data-content="music-image"]');
    if (bodyEl && c.music.body)  bodyEl.textContent = c.music.body;
    if (imgEl  && c.music.image) imgEl.src = c.music.image;
  }

  // Community
  if (c.community) {
    const bodyEl = document.querySelector('[data-content="community-body"]');
    const imgEl  = document.querySelector('[data-content="community-image"]');
    if (bodyEl && c.community.body)  bodyEl.textContent = c.community.body;
    if (imgEl  && c.community.image) imgEl.src = c.community.image;
  }

  // Services
  if (c.services) {
    const headEl = document.querySelector('[data-content="services-heading"]');
    const bodyEl = document.querySelector('[data-content="services-body"]');
    const img1El = document.querySelector('[data-content="services-image1"]');
    const img2El = document.querySelector('[data-content="services-image2"]');
    if (headEl && c.services.heading) headEl.textContent = c.services.heading;
    if (bodyEl && c.services.body)    bodyEl.textContent = c.services.body;
    if (img1El && c.services.image1)  img1El.src = c.services.image1;
    if (img2El && c.services.image2)  img2El.src = c.services.image2;
  }
}

function renderHomepageEvents() {
  const grid = document.querySelector('.poster-grid');
  if (!grid) return;

  const events = Store.Events.getFeatured();
  if (!events.length) return;

  const [hero, ...rest] = events;

  let html = `
    <div class="poster-card poster-card--hero" data-event-id="${hero.id}" style="cursor:pointer;">
      <img src="${hero.image}" alt="${hero.title}" class="poster-img" />
      <div class="poster-overlay"></div>
      <div class="poster-content">
        <span class="poster-tag">${hero.tag}</span>
        <h3 class="poster-name">${hero.title}</h3>
        <p class="poster-desc">${hero.description.slice(0, 120)}…</p>
        <div class="poster-footer">
          <span class="poster-date">${hero.date}</span>
          <a href="event.html?id=${hero.id}" class="poster-pill">More →</a>
        </div>
      </div>
    </div>`;

  if (rest.length) {
    html += `<div class="poster-right-stack">`;
    rest.slice(0, 3).forEach(e => {
      html += `
        <div class="poster-card poster-card--sm" data-event-id="${e.id}" style="cursor:pointer;">
          <img src="${e.image}" alt="${e.title}" class="poster-img" />
          <div class="poster-overlay"></div>
          <div class="poster-content">
            <span class="poster-tag">${e.tag}</span>
            <h3 class="poster-name">${e.title}</h3>
            <div class="poster-footer">
              <span class="poster-date">${e.date}</span>
              <a href="event.html?id=${e.id}" class="poster-pill">More →</a>
            </div>
          </div>
        </div>`;
    });
    html += `</div>`;
  }

  grid.innerHTML = html;

  // Make cards clickable
  grid.querySelectorAll('.poster-card').forEach(card => {
    const id = card.dataset.eventId;
    if (id) {
      card.addEventListener('click', e => {
        if (!e.target.classList.contains('poster-pill')) {
          window.location.href = 'event.html?id=' + id;
        }
      });
    }
  });
}