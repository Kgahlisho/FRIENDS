/**
 * &FRIENDS — gallery-public.js
 * Public gallery page. All data from Store.Gallery.
 */

let allCampaigns = [];
let lightboxImages = [];
let lightboxIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  allCampaigns = Store.Gallery.getPublished();
  renderCampaigns(allCampaigns);
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

function renderCampaigns(campaigns) {
  const container = document.getElementById('galleryCampaigns');
  const empty = document.getElementById('galleryEmpty');

  if (!campaigns.length) {
    empty.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(empty);
    return;
  }

  empty.style.display = 'none';
  container.innerHTML = campaigns.map(c => `
    <div class="campaign-block" data-tag="${c.tag}">
      <div class="campaign-header">
        <div>
          <span class="campaign-tag">${c.tag}</span>
          <h2 class="campaign-title">${c.campaign}</h2>
          <span class="campaign-date">${c.date}</span>
        </div>
        <span class="campaign-count">${c.images.length} image${c.images.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="campaign-grid" id="campaign-${c.id}">
        ${c.images.map((img, idx) => `
          <div class="campaign-img-wrap" onclick="openLightbox('${c.id}', ${idx})">
            <img src="${img.src}" alt="${img.caption || ''}" loading="lazy" />
            <div class="campaign-img-overlay">
              <span>${img.caption || ''}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

function filterGallery(tag, btn) {
  document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = tag === 'all' ? allCampaigns : allCampaigns.filter(c => c.tag === tag);
  renderCampaigns(filtered);
}

// ── Lightbox ────────────────────────────────────────────────────
function openLightbox(campaignId, startIdx) {
  const campaign = Store.Gallery.getById(campaignId);
  if (!campaign) return;
  lightboxImages = campaign.images;
  lightboxIndex = startIdx;
  showLightboxImage();
  document.getElementById('lightbox').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function showLightboxImage() {
  const img = lightboxImages[lightboxIndex];
  document.getElementById('lightboxImg').src = img.src;
  document.getElementById('lightboxCaption').textContent = img.caption || '';
}

function lightboxNav(dir, e) {
  if (e) e.stopPropagation();
  lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
  showLightboxImage();
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById('lightbox') && !e.target.classList.contains('lightbox-close')) return;
  document.getElementById('lightbox').style.display = 'none';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (lb.style.display === 'none') return;
  if (e.key === 'Escape') closeLightbox({target: lb});
  if (e.key === 'ArrowLeft') lightboxNav(-1, null);
  if (e.key === 'ArrowRight') lightboxNav(1, null);
});