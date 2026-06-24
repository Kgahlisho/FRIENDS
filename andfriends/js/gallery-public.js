
/**
 * &FRIENDS — gallery-public.js
 *
 * "All" now uses the EXACT same render path as tag filters — just
 * without filtering by tag. If &Bloom works, All works.
 */

let _lightboxImages = [];
let _lightboxIndex  = 0;

/* ─── Init ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

    try { await Store.Gallery.fetchAll(); }
    catch (e) { console.error('[gallery] fetch failed:', e); }

    try { await Store.Content.fetch(); }
    catch (e) { console.error('[gallery] content fetch failed:', e); }

    filterGallery('all', document.querySelector('.gallery-filter-btn[data-tag="all"]'));
    _loadFooter();

    document.addEventListener('af:gallery', () => {
        const active = document.querySelector('.gallery-filter-btn.active');
        filterGallery(active ? active.dataset.tag : 'all', active);
    });
    document.addEventListener('af:content', _loadFooter);
});

/* ─── Get ALL campaigns from cache — no published filter ────────── */
// We trust the admin only publishes what should be visible.
// Removing the published filter eliminates any chance of it
// silently returning [] due to a field type mismatch.
function _getCampaigns() {
    return Store.Gallery.getAll() || [];
}

/* ─── Image src helper ───────────────────────────────────────────── */
function imgSrc(src) {
    if (!src) return '';
    return (src.startsWith('http') || src.startsWith('data:')) ? src : '../' + src;
}

/* ─── Footer ─────────────────────────────────────────────────────── */
function _loadFooter() {
    const c = Store.Content.getSection('contact');
    if (!c) return;
    const ph = document.getElementById('footerPhone');
    const em = document.getElementById('footerEmail');
    if (ph) ph.textContent = 'Call Us: ' + (c.phone || '');
    if (em) { em.textContent = 'Email Us: ' + (c.email || ''); em.href = 'mailto:' + (c.email || ''); }
}

/* ─── Normalise tag for comparison ──────────────────────────────── */
const _norm = t => (t || '').replace(/&/g, '').trim().toLowerCase();

/* ═══════════════════════════════════════════════════════════════════
   FILTER — single render function for ALL cases
   "All" = no tag filter applied. Same code path as &Bloom.
═══════════════════════════════════════════════════════════════════ */
function filterGallery(tag, btn) {

    // Update active button
    document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const all = _getCampaigns();

    // "All" = show every campaign. Tag = filter by tag. Same renderer either way.
    const toShow = (!tag || tag === 'all')
        ? all
        : all.filter(c => _norm(c.tag) === _norm(tag));

    _renderCampaigns(toShow);
}

/* ═══════════════════════════════════════════════════════════════════
   RENDER — one function, used by both All and tag filters
═══════════════════════════════════════════════════════════════════ */
function _renderCampaigns(campaigns) {
    const container = document.getElementById('galleryCampaigns');
    if (!container) return;

    if (!campaigns || !campaigns.length) {
        container.innerHTML = '<div class="gallery-empty"><p>No campaigns found.</p></div>';
        return;
    }

    container.innerHTML = campaigns.map(c => {
        const images = Array.isArray(c.images) ? c.images.filter(i => i && i.src) : [];
        return `
            <div class="campaign-block" data-tag="${c.tag || ''}">
                <div class="campaign-header">
                    <div>
                        <span class="campaign-tag">${c.tag || ''}</span>
                        <h2 class="campaign-title">${c.campaign || 'Untitled'}</h2>
                        <span class="campaign-date">${c.date || ''}</span>
                    </div>
                    <span class="campaign-count">${images.length} image${images.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="campaign-grid">
                    ${images.map((img, idx) => `
                        <div class="campaign-img-wrap" onclick="openLightbox('${c.id}', ${idx})">
                            <img src="${imgSrc(img.src)}" alt="${img.caption || ''}" loading="lazy" />
                            <div class="campaign-img-overlay"><span>${img.caption || ''}</span></div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }).join('');
}

/* ═══════════════════════════════════════════════════════════════════
   LIGHTBOX
═══════════════════════════════════════════════════════════════════ */
function openLightbox(campaignId, startIdx) {
    const campaign = Store.Gallery.getById(campaignId);
    if (!campaign) return;
    _lightboxImages = (Array.isArray(campaign.images) ? campaign.images : [])
        .filter(i => i && i.src);
    _lightboxIndex = startIdx;
    _showLightboxImage();
    const lb = document.getElementById('lightbox');
    if (lb) lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function _showLightboxImage() {
    const img = _lightboxImages[_lightboxIndex];
    if (!img) return;
    const el  = document.getElementById('lightboxImg');
    const cap = document.getElementById('lightboxCaption');
    if (el)  el.src = imgSrc(img.src);
    if (cap) cap.textContent = img.caption || '';
}

function lightboxNav(dir, e) {
    if (e) e.stopPropagation();
    if (!_lightboxImages.length) return;
    _lightboxIndex = (_lightboxIndex + dir + _lightboxImages.length) % _lightboxImages.length;
    _showLightboxImage();
}

function closeLightbox(e) {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    if (e && e.target !== lb && !e.target.classList.contains('lightbox-close')) return;
    lb.style.display = 'none';
    document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.style.display === 'none') return;
    if (e.key === 'Escape')     closeLightbox({ target: lb });
    if (e.key === 'ArrowLeft')  lightboxNav(-1);
    if (e.key === 'ArrowRight') lightboxNav(1);
});