/**
 * &FRIENDS — js/gallery-admin.js
 */

document.getElementById('sidebarMount').outerHTML = renderAdminSidebar('admin_gallery.html');

    let editingCampaignId = null;
    let activeCampaignId = null;
    let pendingImages = [];

    document.addEventListener('DOMContentLoaded', renderCampaigns);

    // ── Render campaigns ─────────────────────────────────────
    function renderCampaigns() {
      const campaigns = Store.Gallery.getAll().reverse();
      const grid = document.getElementById('campaignsGrid');

      if (!campaigns.length) {
        grid.innerHTML = `<div class="admin-card"><div class="admin-empty">
          <div class="admin-empty-icon">🖼</div>
          <h3>No campaigns yet</h3>
          <p>Create a campaign to start organising your gallery.</p>
          <button class="btn-primary" onclick="openCampaignModal()">+ New Campaign</button>
        </div></div>`; return;
      }

      grid.innerHTML = campaigns.map(c => `
        <div class="admin-card">
          <div class="admin-card-header">
            <div style="display:flex;align-items:center;gap:12px;">
              ${c.cover ? `<img src="${c.cover}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;" onerror="this.style.display='none'" />` : '<div style="width:48px;height:48px;background:var(--pink-light);border-radius:8px;"></div>'}
              <div>
                <div style="font-weight:600;font-size:15px;">${c.campaign}</div>
                <div style="font-size:12px;color:var(--admin-muted);">${c.tag} · ${c.date} · ${c.images.length} images</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="badge ${c.published ? 'badge-published' : 'badge-draft'}">${c.published ? 'Published' : 'Draft'}</span>
              <button class="btn-icon" onclick="openCampaignModal('${c.id}')" title="Edit">✏️</button>
              <button class="btn-icon" onclick="togglePublished('${c.id}')" title="Toggle publish">${c.published ? '⏸' : '▶'}</button>
              <button class="btn-icon danger" onclick="deleteCampaign('${c.id}')" title="Delete">🗑</button>
            </div>
          </div>
          <div class="admin-card-body">
            ${c.images.length ? `
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-bottom:14px;">
                ${c.images.map(img => `
                  <div class="img-preview-item">
                    <img src="${img.src}" alt="${img.caption}" onerror="this.src=''" />
                    <button class="img-remove" onclick="removeImage('${c.id}','${img.id}')">✕</button>
                  </div>`).join('')}
              </div>` : `<p style="font-size:13px;color:var(--admin-muted);margin-bottom:14px;">No images yet in this campaign.</p>`}
            <button class="btn-secondary btn-sm" onclick="openImagesModal('${c.id}')">+ Add Images</button>
          </div>
        </div>`).join('');
    }

    // ── Campaign modal ────────────────────────────────────────
    function openCampaignModal(id = null) {
      editingCampaignId = id;
      if (id) {
        const c = Store.Gallery.getById(id);
        document.getElementById('campaignModalTitle').textContent = 'Edit Campaign';
        document.getElementById('campName').value = c.campaign;
        document.getElementById('campTag').value = c.tag;
        document.getElementById('campDate').value = c.date;
        document.getElementById('campPublished').checked = c.published;
      } else {
        document.getElementById('campaignModalTitle').textContent = 'New Campaign';
        document.getElementById('campName').value = '';
        document.getElementById('campDate').value = '';
        document.getElementById('campPublished').checked = false;
      }
      openAdminModal('campaignModal');
    }

    function saveCampaign() {
      const name = document.getElementById('campName').value.trim();
      if (!name) { showToast('Please enter a campaign name.', 'error'); return; }
      const data = {
        campaign: name,
        tag: document.getElementById('campTag').value,
        date: document.getElementById('campDate').value.trim() || new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }),
        published: document.getElementById('campPublished').checked,
      };
      if (editingCampaignId) {
        Store.Gallery.updateCampaign(editingCampaignId, data);
        showToast('Campaign updated.');
      } else {
        Store.Gallery.createCampaign(data);
        showToast('Campaign created.');
      }
      closeAdminModal('campaignModal');
      renderCampaigns();
    }

    function togglePublished(id) {
      const c = Store.Gallery.getById(id);
      Store.Gallery.updateCampaign(id, { published: !c.published });
      showToast(c.published ? 'Campaign unpublished.' : 'Campaign published.', 'info');
      renderCampaigns();
    }

    function deleteCampaign(id) {
      const c = Store.Gallery.getById(id);
      adminConfirm(`Delete campaign "${c?.campaign}"?`, () => {
        Store.Gallery.deleteCampaign(id);
        showToast('Campaign deleted.', 'info');
        renderCampaigns();
      });
    }

    // ── Images modal ──────────────────────────────────────────
    function openImagesModal(campaignId) {
      activeCampaignId = campaignId;
      pendingImages = [];
      const c = Store.Gallery.getById(campaignId);
      document.getElementById('imagesModalTitle').textContent = `Add Images — ${c.campaign}`;
      document.getElementById('imgCaption').value = '';
      document.getElementById('pendingImgPreview').innerHTML = '';
      document.getElementById('existingImagesWrap').innerHTML = c.images.length
        ? `<div class="form-label" style="margin-bottom:10px;">Current Images (${c.images.length})</div>
           <div class="img-preview-grid">${c.images.map(img => `
             <div class="img-preview-item">
               <img src="${img.src}" alt="${img.caption}" />
               <button class="img-remove" onclick="removeImage('${campaignId}','${img.id}');renderExisting('${campaignId}')">✕</button>
             </div>`).join('')}</div>` : '';
      openAdminModal('imagesModal');
    }

    function renderExisting(campaignId) {
      const c = Store.Gallery.getById(campaignId);
      const wrap = document.getElementById('existingImagesWrap');
      if (!c || !c.images.length) { wrap.innerHTML = ''; return; }
      wrap.innerHTML = `<div class="form-label" style="margin-bottom:10px;">Current Images (${c.images.length})</div>
        <div class="img-preview-grid">${c.images.map(img => `
          <div class="img-preview-item">
            <img src="${img.src}" />
            <button class="img-remove" onclick="removeImage('${campaignId}','${img.id}');renderExisting('${campaignId}')">✕</button>
          </div>`).join('')}</div>`;
    }

    async function handleImageUploads(input) {
      const files = [...input.files];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        pendingImages.push({ src: base64, name: file.name });
      }
      renderPendingPreviews();
    }

    function renderPendingPreviews() {
      document.getElementById('pendingImgPreview').innerHTML = pendingImages.map((img, i) => `
        <div class="img-preview-item">
          <img src="${img.src}" />
          <button class="img-remove" onclick="removePending(${i})">✕</button>
        </div>`).join('');
    }

    function removePending(idx) {
      pendingImages.splice(idx, 1);
      renderPendingPreviews();
    }

    function saveImages() {
      if (!pendingImages.length) { closeAdminModal('imagesModal'); return; }
      const caption = document.getElementById('imgCaption').value.trim();
      pendingImages.forEach(img => {
        Store.Gallery.addImage(activeCampaignId, { src: img.src, caption });
      });
      showToast(`${pendingImages.length} image${pendingImages.length !== 1 ? 's' : ''} added.`);
      pendingImages = [];
      closeAdminModal('imagesModal');
      renderCampaigns();
    }

    function removeImage(campaignId, imageId) {
      Store.Gallery.deleteImage(campaignId, imageId);
      renderCampaigns();
      showToast('Image removed.', 'info');
    }