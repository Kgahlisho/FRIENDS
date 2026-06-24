/**
 * &FRIENDS — play-page.js
 * Renders events on play.html from Store.Events.
 * Also updates homepage poster cards if on index.html.
 */

document.addEventListener('DOMContentLoaded', () => {

    try{
        await Store.Events.fetchPublished();

        await Store.Content.fetch();

        console.log('Published events:', Store.Events.getPublished());

    
  renderEventsPage();
  loadFooter();
}catch(err) {
    console.error('play page load failed',err);
}
}
);

function loadFooter() {
  const c = Store.Content.getSection('contact');
  if (!c) return;
  const ph = document.getElementById('footerPhone');
  const em = document.getElementById('footerEmail');
  if (ph) ph.textContent = 'Call Us: ' + c.phone;
  if (em) { em.textContent = 'Email Us: ' + c.email; em.href = 'mailto:' + c.email; }
}

function renderEventsPage() {
  const section = document.getElementById('eventsSection');
  if (!section) return;

  const events = Store.Events.getPublished();

  if (!events.length) {
    section.innerHTML = `
      <div class="events-inner" style="text-align:center;padding:80px 40px;">
        <p style="font-size:18px;opacity:.6;">No events currently scheduled. Check back soon.</p>
      </div>`;
    return;
  }

  const [hero, ...rest] = events;

  const heroCard = buildHeroCard(hero);
  const smallCards = rest.map(buildSmallCard).join('');

  section.innerHTML = `
    <div class="events-inner">
      <div class="section-header events-header">
        <div class="section-amp">&</div>
        <h2 class="section-title events-title">WHAT'S<br>COMING</h2>
      </div>
      <div class="poster-grid">
        ${heroCard}
        <div class="poster-right-stack">
          ${smallCards}
        </div>
      </div>
    </div>`;

  // Make full cards clickable
  section.querySelectorAll('.poster-card').forEach(card => {
    const id = card.dataset.eventId;
    if (id) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', e => {
        if (!e.target.classList.contains('poster-pill')) {
          window.location.href = 'event.html?id=' + id;
        }
      });
    }
  });
}

function buildHeroCard(e) {
  return `
    <div class="poster-card poster-card--hero" data-event-id="${e.id}">
      <img src="${resolveImage(e.image)}" alt="${e.title}" class="poster-img" />
      <div class="poster-overlay"></div>
      <div class="poster-content">
        <span class="poster-tag">${e.tag}</span>
        <h3 class="poster-name">${e.title}</h3>
        <p class="poster-desc">${e.description.slice(0, 120)}…</p>
        <div class="poster-footer">
          <span class="poster-date">${e.date}</span>
          <a href="event.html?id=${e.id}" class="poster-pill">More →</a>
        </div>
      </div>
    </div>`;
}

function buildSmallCard(e) {
  return `
    <div class="poster-card poster-card--sm" data-event-id="${e.id}">
      <img src="${resolveImage(e.image)}" alt="${e.title}" class="poster-img" />
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
}