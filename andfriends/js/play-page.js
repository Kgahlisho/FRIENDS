/**
 * &FRIENDS — play-page.js
 * Dynamic Events Page for play.html
 */

document.addEventListener('DOMContentLoaded', async () => {

  console.log('PLAY PAGE INITIALIZING...');

  try {
    if (Store.Auth && Store.Auth.waitForAuth) {
      await Store.Auth.waitForAuth();
    }
  } catch (err) {
    console.warn('Auth wait skipped:', err);
  }

  try {
    await Promise.all([
      Store.Events.fetchPublished(),
      Store.Content.fetch()
    ]);
    console.log('Published Events:', Store.Events.getPublished());
  } catch (err) {
    console.error('Firebase fetch failed:', err);
  }

  renderEventsPage();
  loadFooter();

  document.addEventListener('af:events', () => {
    renderEventsPage();
  });

  document.addEventListener('af:content', () => {
    loadFooter();
  });
});

function loadFooter() {
  const c = Store.Content.getSection('contact');
  if (!c) return;
  const ph = document.getElementById('footerPhone');
  const em = document.getElementById('footerEmail');
  if (ph) ph.textContent = 'Call Us: ' + (c.phone || '');
  if (em) {
    em.textContent = 'Email Us: ' + (c.email || '');
    em.href = 'mailto:' + (c.email || '');
  }
}

function imgSrc(src) {
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('data:')) return src;
  return '../' + src.replace(/^(\.\.\/)+/, '');
}

function renderEventsPage() {
  const section = document.getElementById('eventsSection');
  if (!section) {
    console.error('eventsSection not found');
    return;
  }

  const featured = Store.Events.getFeatured();
  const displayEvents = featured.length ? featured : Store.Events.getPublished();

  console.log('Rendering events:', displayEvents);

  if (!displayEvents.length) {
    section.innerHTML = `
      <div class="events-container" style="text-align:center;padding:60px 40px;">
        <p style="font-size:18px;color:rgba(255,255,255,0.5);">
          No events scheduled yet — check back soon.
        </p>
      </div>
    `;
    return;
  }

  const [hero, ...rest] = displayEvents;
  const stackEvents = rest.slice(0, 3);

  let html = `
    <div class="events-container">
      <!-- Header -->
      <div class="events-header-modern">
        <div class="header-badge">
          <span class="badge-dot"></span>
          <span>UPCOMING EVENTS</span>
          <span class="badge-dot"></span>
        </div>
        <h2 class="events-headline"> LOOK OUT FOR <span class="accent"> : </span></h2>
        <div class="header-decoration">
          <div class="decoration-line"></div>
          <span class="month-indicator" id="eventsMonthLabel">LIVE EVENTS</span>
          <div class="decoration-line"></div>
        </div>
      </div>
      
      <!-- Events Showcase -->
      <div class="events-showcase">
        <!-- Featured Event -->
        <div class="featured-event" data-event-id="${hero.id}" style="cursor:pointer;">
          <div class="featured-event-inner" style="background-image: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.4)), url('${imgSrc(hero.image)}'); background-size: cover; background-position: center;">
            <div class="featured-event-overlay">
              <span class="featured-tag">${escapeHtml(hero.tag || 'EVENT')}</span>
              <h3 class="featured-title">${escapeHtml(hero.title)}</h3>
              <p class="featured-desc">${(hero.description || '').slice(0, 100)}${hero.description?.length > 100 ? '...' : ''}</p>
              <div class="featured-date">
                <span>📅 ${hero.date || ''}</span>
                <span>⏰ ${hero.time || ''}</span>
              </div>
              <a href="event.html?id=${hero.id}" class="featured-link">Discover Event →</a>
            </div>
          </div>
        </div>
        
        <!-- Events Grid -->
        <div class="events-grid-modern">
  `;

  stackEvents.forEach(event => {
    html += `
      <div class="event-card-modern" onclick="window.location.href='event.html?id=${event.id}'">
        <img src="${imgSrc(event.image)}" alt="${escapeHtml(event.title)}" class="event-card-image" onerror="this.src='../Resources/placeholder.jpg'">
        <div class="event-card-content">
          <span class="event-card-tag">${escapeHtml(event.tag || 'EVENT')}</span>
          <h4 class="event-card-title">${escapeHtml(event.title)}</h4>
          <div class="event-card-date">
            <span>📅 ${event.date || ''}</span>
            <span>⏰ ${event.time || ''}</span>
          </div>
          <a href="event.html?id=${event.id}" class="event-card-link">Get Tickets →</a>
        </div>
      </div>
    `;
  });

  html += `
        </div>
      </div>
      
      <!-- CTA -->
      <div class="events-cta-modern">
        <a href="play.html" class="cta-button">
        
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </a>
      </div>
    </div>
  `;

  section.innerHTML = html;

  // Make cards clickable
  section.querySelectorAll('.featured-event, .event-card-modern').forEach(card => {
    const id = card.dataset.eventId;
    if (id) {
      card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('featured-link') && !e.target.classList.contains('event-card-link')) {
          window.location.href = 'event.html?id=' + id;
        }
      });
    }
  });
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