/**
 * &FRIENDS — index-page.js
 * Loads admin-managed content into the homepage.
 * Renders dynamic events in the poster grid section.
 * Called only on index.html.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Fetch data from Firebase first
  try { await Store.Content.fetch(); } catch (_) {}
  try { await Store.Events.fetchPublished(); } catch (_) {}

  loadSiteContent();
  renderHomepageEventsModern();
  loadFooter();

  // Stay live — re-render on updates
  document.addEventListener('af:events',  () => renderHomepageEventsModern());
  document.addEventListener('af:content', () => { loadSiteContent(); loadFooter(); });
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
  // Keep existing loadSiteContent function
  const c = Store.Content.get();
  if (!c) return;

  // Hero
  if (c.hero) {
    const heroHeadEl = document.querySelector('.hero-heading, .hero h1, [data-content="hero-headline"]');
    const heroSubEl  = document.querySelector('.hero-sub, .hero p, [data-content="hero-subtext"]');
    const heroImgEl  = document.querySelector('.hero-bg, .hero-img, [data-content="hero-image"]');
    if (heroHeadEl && c.hero.headline) heroHeadEl.textContent = c.hero.headline;
    if (heroSubEl  && c.hero.subtext)  heroSubEl.textContent  = c.hero.subtext;
    if (heroImgEl  && c.hero.image)    heroImgEl.src = imgSrc(c.hero.image);
  }

  // About / Corner
  if (c.about) {
    const bodyEl = document.querySelector('[data-content="about-body"]');
    const imgEl  = document.querySelector('[data-content="about-image"]');
    if (bodyEl && c.about.body)  bodyEl.textContent = c.about.body;
    if (imgEl  && c.about.image) imgEl.src = imgSrc(c.about.image);
  }

  // Talk
  if (c.talk) {
    const bodyEl = document.querySelector('[data-content="talk-body"]');
    const imgEl  = document.querySelector('[data-content="talk-image"]');
    if (bodyEl && c.talk.body)  bodyEl.textContent = c.talk.body;
    if (imgEl  && c.talk.image) imgEl.src = imgSrc(c.talk.image);
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
    if (imgEl   && c.food.image) imgEl.src = imgSrc(c.food.image);
  }

  // Music
  if (c.music) {
    const bodyEl = document.querySelector('[data-content="music-body"]');
    const imgEl  = document.querySelector('[data-content="music-image"]');
    if (bodyEl && c.music.body)  bodyEl.textContent = c.music.body;
    if (imgEl  && c.music.image) imgEl.src = imgSrc(c.music.image);
  }

  // Community
  if (c.community) {
    const bodyEl = document.querySelector('[data-content="community-body"]');
    const imgEl  = document.querySelector('[data-content="community-image"]');
    if (bodyEl && c.community.body)  bodyEl.textContent = c.community.body;
    if (imgEl  && c.community.image) imgEl.src = imgSrc(c.community.image);
  }

  // Services
  if (c.services) {
    const headEl = document.querySelector('[data-content="services-heading"]');
    const bodyEl = document.querySelector('[data-content="services-body"]');
    const img1El = document.querySelector('[data-content="services-image1"]');
    const img2El = document.querySelector('[data-content="services-image2"]');
    if (headEl && c.services.heading) headEl.textContent = c.services.heading;
    if (bodyEl && c.services.body)    bodyEl.textContent = c.services.body;
    if (img1El && c.services.image1)  img1El.src = imgSrc(c.services.image1);
    if (img2El && c.services.image2)  img2El.src = imgSrc(c.services.image2);
  }
}

function imgSrc(src) {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return '../' + src;
}

// New Modern Events Renderer
function renderHomepageEventsModern() {
  const events = Store.Events.getFeatured();
  const displayEvents = events.length ? events : Store.Events.getPublished();

  if (!displayEvents.length) {
    const featuredContainer = document.getElementById('featuredEvent');
    const gridContainer = document.getElementById('eventsGridModern');
    if (featuredContainer) {
      featuredContainer.innerHTML = `<div class="featured-event-inner" style="background: #1a1a1a; display: flex; align-items: center; justify-content: center;"><p style="color: white;">No events scheduled yet</p></div>`;
    }
    if (gridContainer) {
      gridContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">Check back soon for upcoming events</div>`;
    }
    return;
  }

  // Set month label
  const monthLabel = document.getElementById('eventsMonthLabel');
  if (monthLabel) {
    const now = new Date();
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    monthLabel.textContent = months[now.getMonth()] + ' ' + now.getFullYear();
  }

  const [hero, ...rest] = displayEvents;

  // Render Featured Event
  const featuredContainer = document.getElementById('featuredEvent');
  if (featuredContainer) {
    featuredContainer.innerHTML = `
      <div class="featured-event-inner" style="background-image: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4)), url('${imgSrc(hero.image)}'); background-size: cover; background-position: center;">
        <div class="featured-event-overlay">
          <span class="featured-tag">${escapeHtml(hero.tag)}</span>
          <h3 class="featured-title">${escapeHtml(hero.title)}</h3>
          <p class="featured-desc">${(hero.description || '').slice(0, 100)}${hero.description?.length > 100 ? '...' : ''}</p>
          <div class="featured-date">
            <span>📅 ${hero.date}</span>
            <span>⏰ ${hero.time}</span>
          </div>
          <a href="event.html?id=${hero.id}" class="featured-link">Discover Event →</a>
        </div>
      </div>
    `;
  }

  // Render Event Grid
  const gridContainer = document.getElementById('eventsGridModern');
  if (gridContainer && rest.length) {
    gridContainer.innerHTML = rest.slice(0, 4).map(event => `
      <div class="event-card-modern" onclick="window.location.href='event.html?id=${event.id}'">
        <img src="${imgSrc(event.image)}" alt="${escapeHtml(event.title)}" class="event-card-image" onerror="this.src='../Resources/placeholder.jpg'">
        <div class="event-card-content">
          <span class="event-card-tag">${escapeHtml(event.tag)}</span>
          <h4 class="event-card-title">${escapeHtml(event.title)}</h4>
          <div class="event-card-date">
            <span>📅 ${event.date}</span>
            <span>⏰ ${event.time}</span>
          </div>
          <a href="event.html?id=${event.id}" class="event-card-link">Get Tickets →</a>
        </div>
      </div>
    `).join('');
  } else if (gridContainer) {
    gridContainer.innerHTML = `<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">More events coming soon</div>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}