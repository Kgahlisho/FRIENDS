/**
 * &FRIENDS — js/content-admin.js
 */

document.getElementById('sidebarMount').outerHTML =
  renderAdminSidebar('admin_content.html');

// Stores uploaded images temporarily before saving
const stagedImages = {};



//LOAD CONTENT ON PAGE OPEN
document.addEventListener('DOMContentLoaded', async () => {
  await Store.Content.fetch();
  populateAllFields();
  hmInit();
});


// TAB SWITCHING
function switchSection(key, btn) {
  document.querySelectorAll('.section-tab')
    .forEach(b => b.classList.remove('active'));

  document.querySelectorAll('.content-section')
    .forEach(s => s.classList.remove('active'));

  btn.classList.add('active');
  document.getElementById('section-' + key).classList.add('active');
}



// POPULATE ALL FIELDS FROM FIREBASE
function populateAllFields() {
  const c = Store.Content.get();
  if (!c) return;

  const fill = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };

  const preview = (id, src) => {
    const el = document.getElementById(id);
    if (!el || !src) return;

    const url =
      src.startsWith('data:') || src.startsWith('http')
        ? src
        : '../' + src;

    el.innerHTML = `
      <img src="${url}"
        style="height:70px;border-radius:6px;object-fit:cover;" />
    `;
  };

  // HERO
  fill('hero-headline', c.hero?.headline);
  fill('hero-subtext', c.hero?.subtext);
  preview('prev-hero-image', c.hero?.image);

  // ABOUT
  fill('about-heading', c.about?.heading);
  fill('about-body', c.about?.body);
  preview('prev-about-image', c.about?.image);

  // TALK
  fill('talk-body', c.talk?.body);
  preview('prev-talk-image', c.talk?.image);

  // FOOD
  fill('food-body', c.food?.body);
  fill('food-quote', c.food?.quote);
  fill('food-chef', c.food?.chef);
  preview('prev-food-image', c.food?.image);

  // MUSIC
  fill('music-body', c.music?.body);
  preview('prev-music-image', c.music?.image);

  // COMMUNITY
  fill('community-body', c.community?.body);
  preview('prev-community-image', c.community?.image);

  // SERVICES
  fill('services-heading', c.services?.heading);
  fill('services-body', c.services?.body);
  preview('prev-services-image1', c.services?.image1);
  preview('prev-services-image2', c.services?.image2);

  // CONTACT
  fill('contact-phone', c.contact?.phone);
  fill('contact-email', c.contact?.email);
  fill('contact-address', c.contact?.address);
}



// IMAGE UPLOAD (PER SECTION)
async function uploadSectionImage(section, key, input) {
  const file = input.files[0];
  if (!file) return;

  showToast('Uploading image…', 'info');

  try {
    const url = await Store.Content.uploadImage(file, section);

    if (!stagedImages[section]) stagedImages[section] = {};
    stagedImages[section][key] = url;

    const prevEl = document.getElementById(`prev-${section}-${key}`);
    if (prevEl) {
      prevEl.innerHTML = `
        <img src="${url}"
          style="height:70px;border-radius:6px;object-fit:cover;" />
      `;
    }

    showToast('Image uploaded.');
  } catch (err) {
    // fallback base64
    const b64 = await fileToBase64(file);

    if (!stagedImages[section]) stagedImages[section] = {};
    stagedImages[section][key] = b64;

    const prevEl = document.getElementById(`prev-${section}-${key}`);
    if (prevEl) {
      prevEl.innerHTML = `
        <img src="${b64}"
          style="height:70px;border-radius:6px;object-fit:cover;" />
      `;
    }
  }
}



//  SAVE SECTION TO FIREBASE
async function saveSection(section) {
  const get = id => document.getElementById(id)?.value;

  let data = {};

  if (section === 'hero') {
    data = {
      headline: get('hero-headline'),
      subtext: get('hero-subtext')
    };
  }

  else if (section === 'about') {
    data = {
      heading: get('about-heading'),
      body: get('about-body')
    };
  }

  else if (section === 'talk') {
    data = { body: get('talk-body') };
  }

  else if (section === 'food') {
    data = {
      body: get('food-body'),
      quote: get('food-quote'),
      chef: get('food-chef')
    };
  }

  else if (section === 'music') {
    data = { body: get('music-body') };
  }

  else if (section === 'community') {
    data = { body: get('community-body') };
  }

  else if (section === 'services') {
    data = {
      heading: get('services-heading'),
      body: get('services-body')
    };
  }

  else if (section === 'contact') {
    data = {
      phone: get('contact-phone'),
      email: get('contact-email'),
      address: get('contact-address')
    };
  }

  // merge staged images (Firebase upload results)
  if (stagedImages[section]) {
    Object.assign(data, stagedImages[section]);
  }

  showToast('Saving…', 'info');

  await Store.Content.updateSection(section, data);

  showToast('Section saved successfully.');
}


const HM_DEFAULTS = {
  frames: {
    frame1: ['rl5mq3ehahgcufivmlwk.webp', 'Creative space.jpg', 'wvpw8vannd2pwexpidcz.webp'],
    frame2: ['oxrq7axkuxdshtymdkrx.webp', '316132.jpg', 'ylzsubmgvfyd6facu8xy.webp'],
    frame3: ['galley.jpg', 'udtd6048cfaq6tjozwvh.webp', '316133.jpg']
  },
  comm: {
    arch: 'galley.jpg', archAlt: 'Community space',
    p1: 'fun.jpg', p1alt: 'Friends playing chess', p1cap: 'Game nights',
    p2: 'SaveClip.App_628036653_18407257912122938_8409960298707074470_n.jpg', p2alt: 'A guest with flowers', p2cap: 'Workshops',
    p3: 'yomzansi_4352.jpg', p3alt: 'Friends laughing together', p3cap: 'Laughter',
    p4: 'yomzansi_4458.jpg', p4alt: 'A dance floor full of people', p4cap: 'Dance parties'
  }
};
const HM_FRAMES = [
  { key: 'frame1', label: 'Frame 1 — big arch (left)' },
  { key: 'frame2', label: 'Frame 2 — top right' },
  { key: 'frame3', label: 'Frame 3 — bottom right' }
];
const HM_POLS = [
  { n: 1, label: 'Polaroid 1 — top left' },
  { n: 2, label: 'Polaroid 2 — top right' },
  { n: 3, label: 'Polaroid 3 — bottom left' },
  { n: 4, label: 'Polaroid 4 — bottom right' }
];
const HM_MAX_SLIDES = 8;
const hm = { frames: {}, comm: {} };

const hmEsc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// admin page lives in the project root, so default photos are in Resources/
function hmUrl(src) {
  if (!src) return '';
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  return src.indexOf('/') > -1 ? src : 'Resources/' + src;
}

function hmLoad() {
  const h = Store.Content.getSection('hostHome') || {};
  HM_FRAMES.forEach(f => {
    const saved = h[f.key];
    hm.frames[f.key] = (Array.isArray(saved) && saved.length ? saved : HM_DEFAULTS.frames[f.key]).slice();
  });
  const c = Store.Content.getSection('communityHome') || {};
  hm.comm = { ...HM_DEFAULTS.comm };
  Object.keys(HM_DEFAULTS.comm).forEach(k => {
    if (typeof c[k] === 'string' && (c[k] !== '' || /cap$|alt$/i.test(k))) hm.comm[k] = c[k];
  });
}

function hmInit() {
  hmLoad();
  hmRender();
}

function hmDirty(which) {
  const el = document.getElementById('hm-dirty-' + which);
  if (el) el.textContent = '● Unsaved changes';
}
function hmClean(which) {
  const el = document.getElementById('hm-dirty-' + which);
  if (el) el.textContent = '';
}

// shrink big photos so a base64 fallback can never blow the 1 MB Firestore limit
function hmShrink(file) {
  if (file.size < 1.2 * 1024 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) return Promise.resolve(file);
  return new Promise(resolve => {
    const img = new Image(), u = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1800, r = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * r); cv.height = Math.round(img.height * r);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      cv.toBlob(b => {
        URL.revokeObjectURL(u);
        resolve(b ? new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file);
      }, 'image/jpeg', 0.86);
    };
    img.onerror = () => { URL.revokeObjectURL(u); resolve(file); };
    img.src = u;
  });
}

async function hmUpload(file, section) {
  showToast('Uploading photo…', 'info');
  const small = await hmShrink(file);
  let url = '';
  try { url = await Store.Content.uploadImage(small, section); } catch (e) { url = ''; }
  if (!url) { try { url = await fileToBase64(small); } catch (e) { url = ''; } }
  if (!url) showToast('Upload failed — please try again.', 'error');
  return url;
}

/* render */
function hmRender() {
  const host = document.getElementById('hostHomeMount');
  if (host) {
    host.innerHTML = HM_FRAMES.map(f => {
      const list = hm.frames[f.key];
      return `
      <div class="hm-block">
        <div class="hm-head"><strong>${f.label}</strong><span>Photos fade through one after another, in this order.</span></div>
        <div class="hm-row">
          ${list.map((s, i) => `
            <div class="hm-slide">
              <span class="hm-num">${i + 1}</span>
              <img src="${hmEsc(hmUrl(s))}" alt="" />
              <div class="hm-actions">
                <button type="button" class="hm-btn" ${i === 0 ? 'disabled' : ''} title="Move earlier" onclick="hmMove('${f.key}',${i},-1)">◀</button>
                <label class="hm-btn" title="Replace this photo">Replace<input type="file" accept="image/*" hidden onchange="hmReplace('${f.key}',${i},this)" /></label>
                <button type="button" class="hm-btn hm-del" ${list.length <= 1 ? 'disabled' : ''} title="Remove" onclick="hmRemove('${f.key}',${i})">✕</button>
                <button type="button" class="hm-btn" ${i === list.length - 1 ? 'disabled' : ''} title="Move later" onclick="hmMove('${f.key}',${i},1)">▶</button>
              </div>
            </div>`).join('')}
          ${list.length < HM_MAX_SLIDES ? `
            <label class="hm-add"><b>+</b><span>Add photo</span>
              <input type="file" accept="image/*" hidden onchange="hmAdd('${f.key}',this)" /></label>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  const cm = document.getElementById('communityHomeMount');
  if (cm) {
    const c = hm.comm;
    cm.innerHTML = `
      <div class="hm-block">
        <div class="hm-head"><strong>Centre arch photo</strong><span>The tall arched photo between the two text columns.</span></div>
        <div class="hm-single">
          <img src="${hmEsc(hmUrl(c.arch))}" alt="" />
          <div class="hm-fields">
            <label class="hm-btn">Replace photo<input type="file" accept="image/*" hidden onchange="hmCommUpload('arch',this)" /></label>
            <input class="form-input" placeholder="Describe the photo (alt text)" value="${hmEsc(c.archAlt)}" oninput="hmCommField('archAlt',this.value)" />
          </div>
        </div>
      </div>
      ${HM_POLS.map(p => `
      <div class="hm-block">
        <div class="hm-head"><strong>${p.label}</strong><span>Small polaroid around the arch.</span></div>
        <div class="hm-single">
          <img src="${hmEsc(hmUrl(c['p' + p.n]))}" alt="" />
          <div class="hm-fields">
            <label class="hm-btn">Replace photo<input type="file" accept="image/*" hidden onchange="hmCommUpload('p${p.n}',this)" /></label>
            <input class="form-input" placeholder="Caption under the photo" value="${hmEsc(c['p' + p.n + 'cap'])}" oninput="hmCommField('p${p.n}cap',this.value)" />
            <input class="form-input" placeholder="Describe the photo (alt text)" value="${hmEsc(c['p' + p.n + 'alt'])}" oninput="hmCommField('p${p.n}alt',this.value)" />
          </div>
        </div>
      </div>`).join('')}`;
  }
}

/* frame actions */
async function hmReplace(key, i, input) {
  const file = input.files[0]; input.value = '';
  if (!file) return;
  const url = await hmUpload(file, 'hostHome');
  if (!url) return;
  hm.frames[key][i] = url; hmRender(); hmDirty('host');
  showToast('Photo replaced — press Save to publish.');
}
async function hmAdd(key, input) {
  const file = input.files[0]; input.value = '';
  if (!file) return;
  const url = await hmUpload(file, 'hostHome');
  if (!url) return;
  hm.frames[key].push(url); hmRender(); hmDirty('host');
  showToast('Photo added — press Save to publish.');
}
function hmRemove(key, i) {
  if (hm.frames[key].length <= 1) return;
  hm.frames[key].splice(i, 1); hmRender(); hmDirty('host');
}
function hmMove(key, i, dir) {
  const l = hm.frames[key], j = i + dir;
  if (j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]]; hmRender(); hmDirty('host');
}

/* community actions */
async function hmCommUpload(field, input) {
  const file = input.files[0]; input.value = '';
  if (!file) return;
  const url = await hmUpload(file, 'communityHome');
  if (!url) return;
  hm.comm[field] = url; hmRender(); hmDirty('community');
  showToast('Photo replaced — press Save to publish.');
}
function hmCommField(field, val) {
  hm.comm[field] = val; hmDirty('community');   // no re-render so typing keeps focus
}

/* save / reset  */
async function saveHostHome() {
  showToast('Saving…', 'info');
  try {
    await Store.Content.updateSection('hostHome', {
      frame1: hm.frames.frame1, frame2: hm.frames.frame2, frame3: hm.frames.frame3
    });
    hmClean('host');
    showToast('Host Your Vision photos saved — live on the site.');
  } catch (err) {
    console.error(err);
    showToast('Could not save. Please try again.', 'error');
  }
}
async function saveCommunityHome() {
  showToast('Saving…', 'info');
  try {
    await Store.Content.updateSection('communityHome', { ...hm.comm });
    hmClean('community');
    showToast('Community photos saved — live on the site.');
  } catch (err) {
    console.error(err);
    showToast('Could not save. Please try again.', 'error');
  }
}
function resetHostHome() {
  if (!confirm('Put the original photos back in all three frames? (Press Save afterwards to publish.)')) return;
  HM_FRAMES.forEach(f => { hm.frames[f.key] = HM_DEFAULTS.frames[f.key].slice(); });
  hmRender(); hmDirty('host');
}
function resetCommunityHome() {
  if (!confirm('Put the original photos and captions back? (Press Save afterwards to publish.)')) return;
  hm.comm = { ...HM_DEFAULTS.comm };
  hmRender(); hmDirty('community');
}