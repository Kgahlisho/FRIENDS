/**
 * &FRIENDS — js/gallery-admin.js
 */

document.getElementById('sidebarMount').outerHTML = renderAdminSidebar('admin_gallery.html');

let editingCampaignId = null;
let activeCampaignId  = null;
let pendingImages     = [];   // [{ localURL: string, file: File }]

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    try { await Store.Gallery.fetchAll(); } catch (e) { console.error('Gallery fetch error:', e); }
    renderCampaigns();
});

// ── Render campaigns ──────────────────────────────────────────────
function renderCampaigns() {
    const campaigns = [...Store.Gallery.getAll()].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const grid = document.getElementById('campaignsGrid');

    if (!campaigns.length) {
        grid.innerHTML = `
            <div class="admin-card">
                <div class="admin-empty">
                    <div class="admin-empty-icon">🖼</div>
                    <h3>No campaigns yet</h3>
                    <p>Create a campaign to start organising your gallery.</p>
                    <button class="btn-primary" onclick="openCampaignModal()">+ New Campaign</button>
                </div>
            </div>`;
        return;
    }

    grid.innerHTML = campaigns.map(c => `
        <div class="admin-card">
            <div class="admin-card-header">
                <div style="display:flex;align-items:center;gap:12px;">
                    ${c.cover
                        ? `<img src="${c.cover}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;" onerror="this.style.display='none'" />`
                        : `<div style="width:48px;height:48px;background:var(--pink-light);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;">🖼</div>`}
                    <div>
                        <div style="font-weight:600;font-size:15px;">${c.campaign}</div>
                        <div style="font-size:12px;color:var(--admin-muted);">${c.tag || ''} · ${c.date || ''} · ${(c.images||[]).length} image${(c.images||[]).length !== 1 ? 's' : ''}</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <span class="badge ${c.published ? 'badge-published' : 'badge-draft'}">${c.published ? 'Published' : 'Draft'}</span>
                    <button class="btn-icon" onclick="openCampaignModal('${c.id}')" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="togglePublished('${c.id}')" title="${c.published ? 'Unpublish' : 'Publish'}">${c.published ? '⏸' : '▶'}</button>
                    <button class="btn-icon danger" onclick="deleteCampaign('${c.id}')" title="Delete">🗑</button>
                </div>
            </div>
            <div class="admin-card-body">
                ${(c.images||[]).length
                    ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-bottom:14px;">
                           ${c.images.map(img => `
                               <div class="img-preview-item">
                                   <img src="${img.src}" alt="${img.caption||''}" onerror="this.parentElement.style.display='none'" />
                                   <button class="img-remove" onclick="removeImage('${c.id}','${img.id}')">✕</button>
                               </div>`).join('')}
                       </div>`
                    : `<p style="font-size:13px;color:var(--admin-muted);margin-bottom:14px;">No images yet.</p>`}
                <button class="btn-secondary btn-sm" onclick="openImagesModal('${c.id}')">+ Add Images</button>
            </div>
        </div>`).join('');
}

// ── Campaign modal ─────────────────────────────────────────────────
function openCampaignModal(id = null) {
    editingCampaignId = id;
    if (id) {
        const c = Store.Gallery.getById(id);
        if (!c) return;
        document.getElementById('campaignModalTitle').textContent = 'Edit Campaign';
        document.getElementById('campName').value        = c.campaign || '';
        document.getElementById('campTag').value         = c.tag      || '';
        document.getElementById('campDate').value        = c.date     || '';
        document.getElementById('campPublished').checked = !!c.published;
    } else {
        document.getElementById('campaignModalTitle').textContent = 'New Campaign';
        document.getElementById('campName').value        = '';
        document.getElementById('campDate').value        = '';
        document.getElementById('campPublished').checked = false;
    }
    openAdminModal('campaignModal');
}

async function saveCampaign() {
    const name = document.getElementById('campName').value.trim();
    if (!name) { showToast('Please enter a campaign name.', 'error'); return; }
    const data = {
        campaign:  name,
        tag:       document.getElementById('campTag').value,
        date:      document.getElementById('campDate').value || new Date().toLocaleDateString('en-ZA', { month:'long', year:'numeric' }),
        published: document.getElementById('campPublished').checked,
    };
    showToast('Saving…', 'info');
    try {
        if (editingCampaignId) {
            await Store.Gallery.updateCampaign(editingCampaignId, data);
            showToast('Campaign updated.');
        } else {
            await Store.Gallery.createCampaign(data);
            showToast('Campaign created.');
        }
        closeAdminModal('campaignModal');
        renderCampaigns();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

async function togglePublished(id) {
    const c = Store.Gallery.getById(id);
    if (!c) return;
    await Store.Gallery.updateCampaign(id, { published: !c.published });
    showToast(c.published ? 'Campaign unpublished.' : 'Campaign published.', 'info');
    renderCampaigns();
}

function deleteCampaign(id) {
    const c = Store.Gallery.getById(id);
    adminConfirm(`Delete campaign "${c?.campaign}"?`, async () => {
        await Store.Gallery.deleteCampaign(id);
        showToast('Campaign deleted.', 'info');
        renderCampaigns();
    });
}

// ── Images modal ──────────────────────────────────────────────────
function openImagesModal(campaignId) {
    activeCampaignId = campaignId;
    pendingImages    = [];
    const c = Store.Gallery.getById(campaignId);
    if (!c) return;

    document.getElementById('imagesModalTitle').textContent = `Add Images — ${c.campaign}`;
    document.getElementById('imgCaption').value             = '';
    document.getElementById('pendingImgPreview').innerHTML  = '';
    _renderExisting(c);
    openAdminModal('imagesModal');
    _wireGalleryInput();
}

function _renderExisting(c) {
    const wrap = document.getElementById('existingImagesWrap');
    if (!wrap) return;
    wrap.innerHTML = (c.images||[]).length
        ? `<div class="form-label" style="margin-bottom:10px;">Current Images (${c.images.length})</div>
           <div class="img-preview-grid">
               ${c.images.map(img => `
                   <div class="img-preview-item">
                       <img src="${img.src}" alt="${img.caption||''}" onerror="this.parentElement.style.display='none'" />
                       <button class="img-remove" onclick="removeImage('${c.id}','${img.id}')">✕</button>
                   </div>`).join('')}
           </div>`
        : '';
}

// ── Wire the file input for drag-drop ─────────────────────────────
// The file INPUT (position:absolute, inset:0, opacity:0) sits ON TOP of the zone div.
// Drag events target the input — so we listen on the INPUT itself.
function _wireGalleryInput() {
    const zone  = document.getElementById('imgUploadZone');
    const input = zone ? zone.querySelector('input[type="file"]') : null;
    if (!input || input._wired) return;
    input._wired = true;

    input.addEventListener('dragenter', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    input.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
    input.addEventListener('dragleave', e => { e.preventDefault(); zone.classList.remove('drag-over'); });
    input.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const files = [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/'));
        if (files.length) _stageFiles(files);
    });
}

// ── File input onchange (click to browse) ─────────────────────────
function handleImageUploads(input) {
    const files = [...input.files];
    if (!files.length) return;
    _stageFiles(files);
    input.value = '';
}

// ── Stage files for upload (show preview immediately) ─────────────
function _stageFiles(files) {
    for (const file of files) {
        const localURL = URL.createObjectURL(file);
        pendingImages.push({ localURL, file });
    }
    _renderPending();
    showToast(`${files.length} image${files.length > 1 ? 's' : ''} ready — click "Add Images" to save.`, 'info');
}

function _renderPending() {
    const container = document.getElementById('pendingImgPreview');
    if (!container) return;
    container.innerHTML = pendingImages.map((img, i) => `
        <div class="img-preview-item">
            <img src="${img.localURL}" style="width:100%;height:100%;object-fit:cover;" />
            <button class="img-remove" onclick="removePending(${i})">✕</button>
        </div>`).join('');
}

function removePending(index) {
    URL.revokeObjectURL(pendingImages[index]?.localURL);
    pendingImages.splice(index, 1);
    _renderPending();
}

// ── Save images — upload to Firebase then write to Firestore ──────
async function saveImages() {
    if (!pendingImages.length) { closeAdminModal('imagesModal'); return; }

    const caption  = document.getElementById('imgCaption').value.trim();
    const saveBtn  = document.querySelector('#imagesModal .btn-primary[onclick="saveImages()"]');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Uploading…'; }

    let savedCount = 0;

    for (const pending of pendingImages) {
        try {
            showToast(`Uploading ${pending.file.name}…`, 'info');

            // uploadImage returns a plain string URL (Firebase Storage or base64 fallback)
            const imageURL = await Store.Gallery.uploadImage(pending.file, activeCampaignId);

            // Revoke the temporary local preview URL
            URL.revokeObjectURL(pending.localURL);

            // Save the record to Firestore — imageURL is always a plain string
            await Store.Gallery.addImage(activeCampaignId, {
                src:     imageURL,
                caption: caption,
            });
            savedCount++;
        } catch (err) {
            console.error('Image save failed:', err);
            showToast(`Failed: ${pending.file.name} — ${err.message}`, 'error');
        }
    }

    pendingImages = [];
    document.getElementById('pendingImgPreview').innerHTML = '';

    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Add Images'; }

    if (savedCount > 0) {
        showToast(`${savedCount} image${savedCount > 1 ? 's' : ''} added successfully.`);
    }

    closeAdminModal('imagesModal');
    renderCampaigns();
}

// ── Remove single image ───────────────────────────────────────────
async function removeImage(campaignId, imageId) {
    await Store.Gallery.deleteImage(campaignId, imageId);
    showToast('Image removed.', 'info');
    renderCampaigns();
}
