/**
 * &FRIENDS — gallery-public.js
 * Renders the "Moments" gallery using the editorial story/mosaic
 * layout defined in css/gallery.css.
 */

let _lightboxImages = [];
let _lightboxIndex = 0;
let _revealObserver = null;

/* ─── Init ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

    // Enable reveal animations only if JS is running
    document.documentElement.classList.add('js-reveal');

    try { await Store.Gallery.fetchAll(); }
    catch (e) { console.error('[gallery] fetch failed:', e); }

    try { await Store.Content.fetch(); }
    catch (e) { console.error('[gallery] content fetch failed:', e); }

    _buildFilterCounts();
    _setupReveal();

    filterGallery('all', document.querySelector('.gallery-filter-btn[data-tag="all"]'));
    _loadFooter();

    document.addEventListener('af:gallery', () => {
        _buildFilterCounts();
        const active = document.querySelector('.gallery-filter-btn.active');
        filterGallery(active ? active.dataset.tag : 'all', active);
    });
    document.addEventListener('af:content', _loadFooter);
});

/* ─── Data ───────────────────────────────────────────────────────── */
function _getCampaigns() {
    return Store.Gallery.getAll() || [];
}

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

/* ─── Tag helpers ────────────────────────────────────────────────── */
const _norm = t => (t || '').replace(/&/g, '').trim().toLowerCase();

const _TAG_CLASS = {
    bloom: 'tag-bloom',
    music: 'tag-music',
    fun: 'tag-fun',
    talk: 'tag-talk',
    food: 'tag-food',
};
function _tagClass(tag) { return _TAG_CLASS[_norm(tag)] || 'tag-other'; }

/* ─── Filter counts ──────────────────────────────────────────────── */
function _buildFilterCounts() {
    const all = _getCampaigns();

    document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
        const tag = btn.dataset.tag;
        const n = (!tag || tag === 'all')
            ? all.length
            : all.filter(c => _norm(c.tag) === _norm(tag)).length;

        // strip any prior count span, then append a fresh one
        btn.querySelector('.gallery-filter-count')?.remove();
        const span = document.createElement('span');
        span.className = 'gallery-filter-count';
        span.textContent = n;
        btn.appendChild(span);

        btn.classList.toggle('is-empty', n === 0 && tag !== 'all');
    });
}

/* ─── Reveal on scroll ───────────────────────────────────────────── */
function _setupReveal() {
    if (!('IntersectionObserver' in window)) {
        // No IO support — just show everything.
        document.documentElement.classList.remove('js-reveal');
        return;
    }
    _revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(en => {
            if (en.isIntersecting) {
                en.target.classList.add('is-in');
                _revealObserver.unobserve(en.target);
            }
        });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
}

/* ═══════════════════════════════════════════════════════════════════
   FILTER
═══════════════════════════════════════════════════════════════════ */
function filterGallery(tag, btn) {
    document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const all = _getCampaigns();
    const toShow = (!tag || tag === 'all')
        ? all
        : all.filter(c => _norm(c.tag) === _norm(tag));

    _renderCampaigns(toShow);
}

/* ═══════════════════════════════════════════════════════════════════
   RENDER
═══════════════════════════════════════════════════════════════════ */
const MAX_TILES = 5; // 1 big + 4 small matches the mosaic grid rules

function _renderCampaigns(campaigns) {
    const container = document.getElementById('galleryCampaigns');
    if (!container) return;

    if (!campaigns || !campaigns.length) {
        container.innerHTML =
            '<div class="gallery-empty"><b>Nothing here yet</b>No campaigns found.</div>';
        return;
    }

    // Sort newest first (uses `date` string if present, else ts)
    const sorted = [...campaigns].sort((a, b) => {
        const da = Date.parse(a.date || a.ts || 0) || 0;
        const db = Date.parse(b.date || b.ts || 0) || 0;
        return db - da;
    });

    container.innerHTML = sorted.map((c, i) => _renderStory(c, i)).join('');

    // Kick off reveal observer for the freshly-rendered stories
    if (_revealObserver) {
        container.querySelectorAll('.story').forEach(el => _revealObserver.observe(el));
    }
}

function _renderStory(c, index) {
    const images = (Array.isArray(c.images) ? c.images : []).filter(i => i && i.src);
    const isSpotlight = index === 0 && images.length > 0;
    const flip = index % 2 === 1; // alternate side of the mosaic

    const tagCls = _tagClass(c.tag);
    const tagLabel = c.tag ? ('&' + c.tag) : '';
    const num = String(index + 1).padStart(2, '0');

    const total = images.length;
    const shown = images.slice(0, MAX_TILES);
    const overflow = total - shown.length;

    const tilesHtml = shown.map((img, k) => `
        <button class="tile" style="--i:${k}"
                onclick="openLightbox('${c.id}', ${k})"
                aria-label="${_esc(img.caption || ('Image ' + (k + 1)))}">
            <img src="${imgSrc(img.src)}" alt="${_esc(img.caption || '')}" loading="lazy" />
            ${img.caption ? `<span class="tile-cap">${_esc(img.caption)}</span>` : ''}
            ${(k === shown.length - 1 && overflow > 0)
            ? `<span class="tile-more">+${overflow}</span>`
            : ''}
        </button>
    `).join('');

    const emptyTile = (!images.length)
        ? `<div class="tile tile--empty"><p>No photos yet</p></div>`
        : '';

    return `
        <article class="story ${flip ? 'flip' : ''} ${isSpotlight ? 'is-spotlight' : ''} ${tagCls}">
            <div class="story-info">
                <div>
                    <span class="story-num">${num}</span>
                    <div class="story-chips">
                        ${tagLabel ? `<span class="chip">${tagLabel}</span>` : ''}
                        ${isSpotlight ? `<span class="chip chip--new">Latest drop</span>` : ''}
                    </div>
                    <h2 class="story-title">${_esc(c.campaign || 'Untitled')}</h2>
                    <p class="story-meta">
                        ${c.date ? `<em>${_esc(c.date)}</em> · ` : ''}
                        ${total} image${total === 1 ? '' : 's'}
                    </p>
                </div>
                ${images.length ? `
                    <button class="story-btn" onclick="openLightbox('${c.id}', 0)">
                        View all <span>→</span>
                    </button>` : ''}
            </div>
            <div class="mosaic" data-n="${shown.length}">
                ${tilesHtml || emptyTile}
            </div>
        </article>
    `;
}

function _esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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

    const el = document.getElementById('lightboxImg');
    const cap = document.getElementById('lightboxCaption');

    if (el) {
        el.src = imgSrc(img.src);
        // restart the swap animation
        el.classList.remove('swap');
        void el.offsetWidth;
        el.classList.add('swap');
    }
    if (cap) cap.textContent = img.caption || '';

    // counter badge (created on first use)
    let counter = document.querySelector('.lightbox-count');
    if (!counter) {
        counter = document.createElement('div');
        counter.className = 'lightbox-count';
        document.getElementById('lightbox')?.appendChild(counter);
    }
    counter.textContent = `${_lightboxIndex + 1} / ${_lightboxImages.length}`;
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
    if (e.key === 'Escape') closeLightbox({ target: lb });
    if (e.key === 'ArrowLeft') lightboxNav(-1);
    if (e.key === 'ArrowRight') lightboxNav(1);
});

//loader 

document.addEventListener('DOMContentLoaded', async () => {

    // Enable reveal animations only if JS is running
    document.documentElement.classList.add('js-reveal');

    // Safety net: never leave the loader up longer than 6s
    const loader = document.getElementById('galLoader');
    const hideLoader = () => {
        if (!loader || loader.classList.contains('is-hidden')) return;
        loader.classList.add('is-hidden');
        // remove from DOM after the fade so it can't trap focus/pointer
        setTimeout(() => loader.remove(), 700);
    };
    const loaderKillswitch = setTimeout(hideLoader, 6000);

    try {
        await Promise.all([
            Store.Gallery.fetchAll().catch(e => console.error('[gallery] fetch failed:', e)),
            Store.Content.fetch().catch(e => console.error('[gallery] content fetch failed:', e)),
        ]);
    } catch (e) {
        console.error('[gallery] init error:', e);
    }

    _buildFilterCounts();
    _setupReveal();

    filterGallery('all', document.querySelector('.gallery-filter-btn[data-tag="all"]'));
    _loadFooter();

    // Hide loader after the first paint of real content
    requestAnimationFrame(() => requestAnimationFrame(() => {
        clearTimeout(loaderKillswitch);
        hideLoader();
    }));

    document.addEventListener('af:gallery', () => {
        _buildFilterCounts();
        const active = document.querySelector('.gallery-filter-btn.active');
        filterGallery(active ? active.dataset.tag : 'all', active);
    });
    document.addEventListener('af:content', _loadFooter);
});