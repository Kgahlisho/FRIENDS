/**
 * &FRIENDS — js/content-admin.js
 */

document.getElementById('sidebarMount').outerHTML =
  renderAdminSidebar('admin_content.html');

// Stores uploaded images temporarily before saving
const stagedImages = {};


// ─────────────────────────────────────────────
// 📦 LOAD CONTENT ON PAGE OPEN
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Store.Content.fetch();
  populateAllFields();
});


// ─────────────────────────────────────────────
// 🧭 TAB SWITCHING
// ─────────────────────────────────────────────
function switchSection(key, btn) {
  document.querySelectorAll('.section-tab')
    .forEach(b => b.classList.remove('active'));

  document.querySelectorAll('.content-section')
    .forEach(s => s.classList.remove('active'));

  btn.classList.add('active');
  document.getElementById('section-' + key).classList.add('active');
}


// ─────────────────────────────────────────────
// 🧠 POPULATE ALL FIELDS FROM FIREBASE
// ─────────────────────────────────────────────
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


// ─────────────────────────────────────────────
// 📤 IMAGE UPLOAD (PER SECTION)
// ─────────────────────────────────────────────
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


// ─────────────────────────────────────────────
// 💾 SAVE SECTION TO FIREBASE
// ─────────────────────────────────────────────
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