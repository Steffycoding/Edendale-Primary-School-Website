/**
 * cards.js — Card Rendering & Admin Card Management
 * Edendale Primary School Website
 *
 * Renders the activity grids and the Grade R gallery from the database
 * instead of hardcoded HTML, so admins can ADD and REMOVE cards — not just
 * edit the ones that happen to exist in the markup.
 *
 * Flow:
 *  1. On load, each [data-card-section] grid fetches its cards from /api/cards
 *  2. If the backend answers, the grid re-renders from that data
 *  3. If it doesn't, the hardcoded HTML already in the page is left alone,
 *     and the existing cards are read out of the DOM so edit mode still works
 *     (changes are in-memory only — a reload discards them)
 *  4. In admin mode each card gains ✎ and × buttons, and each grid gains an
 *     "Add" ghost tile
 *  5. Images can be dropped onto the gallery or picked in the editor
 *
 * Depends on admin.js for login and the body.admin-mode flag.
 */

'use strict';

/* ══════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════ */

/**
 * Editorial length limits. These are tighter than the server's own caps
 * (title is 200) because a 200-character title would break the card layout
 * long before the API complained.
 */
const CARD_LIMITS = {
  title:   60,
  body:    400,
  caption: 40,
  icon:    2
};

/** Offered as quick-picks in the editor, so admins needn't hunt for an emoji. */
const ICON_SUGGESTIONS = [
  '⚽', '🏐', '🏀', '🏉', '🥁', '🎵', '🎨', '🎭',
  '📚', '🔬', '🧩', '📖', '🔤', '🌱', '🧠', '💬',
  '🏆', '🎯', '🌍', '💻', '🍎', '☀️'
];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;   // mirrors the server's 5MB cap
let isUploading = false;

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */

const cardState = {
  page: null,            // 'extras' | 'grade_r'
  cards: [],             // every card on this page
  backendAvailable: true,
  initialised: false,    // guards against a second init pass
  nextLocalId: -1        // negative ids for cards that exist only in the browser
};

/* ══════════════════════════════════════════
   PAGE IDENTITY
   ══════════════════════════════════════════ */

/**
 * Maps the current file to the `page` value used in the database.
 * grade-detail.html is Grade R unless ?grade= says otherwise.
 */
function resolveCardPage() {
  const file = window.location.pathname.split('/').pop().replace('.html', '');

  if (file === 'extracurriculars') return 'extras';
  if (file === 'grade-detail') {
    const grade = new URLSearchParams(window.location.search).get('grade');
    return 'grade_' + (grade ? grade.toLowerCase() : 'r');
  }
  if (file === 'about') return 'about';
  if (file === 'contact') return 'contact';
  return file || 'home';
}

/* ══════════════════════════════════════════
   API — every call degrades gracefully
   ══════════════════════════════════════════ */

/**
 * Writes are admin-only. The session cookie is set secure + SameSite=None, so
 * it does not accompany requests over plain http — the bearer token that
 * admin.js stores at login is what actually authenticates us here.
 */
function cardAuthHeaders(extra) {
  return Object.assign(
    { 'Authorization': 'Bearer ' + (localStorage.getItem('adminToken') || '') },
    extra || {}
  );
}

const cardApi = {
  async list(page) {
    const res = await fetch(`/api/cards?page=${encodeURIComponent(page)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },

  async create(card) {
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: cardAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(card)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
    return data;
  },

  async update(card) {
    const res = await fetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: cardAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(card)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
    return data;
  },

  async remove(id) {
    const res = await fetch(`/api/cards/${id}`, {
      method: 'DELETE',
      headers: cardAuthHeaders()
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'HTTP ' + res.status);
    }
    return true;
  },

  async upload(file) {
    const form = new FormData();
    form.append('file', file);
    // No Content-Type here on purpose — the browser sets the multipart
    // boundary itself, and overriding it breaks the upload.
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: cardAuthHeaders(),
      body: form
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload failed (HTTP ' + res.status + ')');
    return data.url;
  }
};

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * These pages are served from /pages/, so a stored "assets/…" path would
 * resolve to /pages/assets/… and 404. Anything already absolute, a data URL
 * or a full URL is left alone.
 */
function resolveImageUrl(url) {
  if (!url) return '';
  if (/^(https?:\/\/|data:|\/)/i.test(url)) return url;
  return '/' + url.replace(/^\.?\//, '');
}

/**
 * Named inAdminMode, not isAdminMode: admin.js already owns a global
 * `let isAdminMode`, and a clashing declaration in the same global scope
 * stops this whole file from parsing.
 */
function inAdminMode() {
  return document.body.classList.contains('admin-mode');
}

function cardsIn(section) {
  return cardState.cards
    .filter(c => c.section === section)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

/* ══════════════════════════════════════════
   RENDERING
   ══════════════════════════════════════════ */

function renderActivityCard(card) {
  return `
    <div class="card activity-card" data-card-id="${card.id}">
      <div class="card-body">
        <span class="activity-icon" aria-hidden="true">${escapeHtml(card.icon || '')}</span>
        <h3 class="activity-name">${escapeHtml(card.title)}</h3>
        <p class="activity-desc">${escapeHtml(card.body || '')}</p>
      </div>
      ${adminActionsHtml(card)}
    </div>`;
}

function renderGalleryItem(card) {
  // The seeded SVGs are placeholders; real uploads shouldn't wear the badge.
  const isPlaceholder = (card.imageUrl || '').toLowerCase().endsWith('.svg');

  return `
    <figure class="gallery-item" data-card-id="${card.id}">
      <div class="gallery-media">
        <img src="${escapeHtml(resolveImageUrl(card.imageUrl))}" alt="${escapeHtml(card.title)}">
        ${isPlaceholder ? '<span class="gallery-soon">Photo Coming Soon</span>' : ''}
      </div>
      <figcaption>${escapeHtml(card.title)}</figcaption>
      ${adminActionsHtml(card)}
    </figure>`;
}

function renderGenericCard(card) {
  return `
    <div class="card" data-card-id="${card.id}">
      <div class="card-body">
        ${card.icon ? `<span class="activity-icon" aria-hidden="true">${escapeHtml(card.icon)}</span>` : ''}
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.body || '')}</p>
      </div>
      ${adminActionsHtml(card)}
    </div>`;
}

function renderStatBox(card) {
  return `
    <div class="stat-box" data-card-id="${card.id}">
      <div class="stat-number">${escapeHtml(card.title)}</div>
      <div class="stat-label">${escapeHtml(card.body || '')}</div>
      ${adminActionsHtml(card)}
    </div>`;
}

function adminActionsHtml(card) {
  return `
    <div class="card-admin-actions">
      <button class="card-action-btn edit" data-action="edit" data-card-id="${card.id}"
              title="Edit this card" aria-label="Edit ${escapeHtml(card.title)}">✎</button>
      <button class="card-action-btn remove" data-action="remove" data-card-id="${card.id}"
              title="Remove this card" aria-label="Remove ${escapeHtml(card.title)}">×</button>
    </div>`;
}

function ghostTileHtml(section, isGallery) {
  const addText = isGallery ? 'Add Photo' : 'Add Card';
  return `
    <button type="button" class="card-ghost" data-action="add" data-section="${escapeHtml(section)}">
      <span class="ghost-plus">+</span>
      <span>${addText}</span>
    </button>`;
}

/** Repaints one grid from cardState. */
function renderSection(container) {
  const section   = container.dataset.cardSection;
  const isGallery = section === 'gallery';
  const isStats   = section === 'stats';
  const cards     = cardsIn(section);

  let renderer;
  if (isGallery) {
    renderer = renderGalleryItem;
  } else if (isStats) {
    renderer = renderStatBox;
  } else if (section === 'activities' || section === 'extracurricular' || section === 'cocurricular') {
    renderer = renderActivityCard;
  } else {
    renderer = renderGenericCard;
  }

  container.innerHTML =
      cards.map(renderer).join('') +
      ghostTileHtml(section, isGallery);
}

function renderAllSections() {
  document.querySelectorAll('[data-card-section]').forEach(renderSection);
}

/* ══════════════════════════════════════════
   FALLBACK — read cards out of the static HTML
   ══════════════════════════════════════════ */

/**
 * When the backend is unreachable the page still has its hardcoded cards.
 * Reading them into state means edit mode works for a demo, with the caveat
 * that nothing survives a reload.
 */
function harvestStaticCards() {
  const harvested = [];

  document.querySelectorAll('[data-card-section]').forEach(container => {
    const section = container.dataset.cardSection;
    let order = 1;

    // Activity cards (for extracurriculars)
    container.querySelectorAll('.activity-card').forEach(el => {
      harvested.push({
        id:        cardState.nextLocalId--,
        page:      cardState.page,
        section,
        icon:      (el.querySelector('.activity-icon')?.textContent || '').trim(),
        title:     (el.querySelector('.activity-name')?.textContent || '').trim(),
        body:      (el.querySelector('.activity-desc')?.textContent || '').trim(),
        imageUrl:  null,
        sortOrder: order++
      });
    });

    // Gallery items (for grade gallery)
    container.querySelectorAll('.gallery-item').forEach(el => {
      harvested.push({
        id:        cardState.nextLocalId--,
        page:      cardState.page,
        section,
        icon:      null,
        title:     (el.querySelector('figcaption')?.textContent || '').trim(),
        body:      null,
        imageUrl:  el.querySelector('img')?.getAttribute('src') || '',
        sortOrder: order++
      });
    });

    // Generic cards (for about page, contact page, etc.)
    container.querySelectorAll('.card').forEach(el => {
      // Skip if already handled as activity-card or gallery-item
      if (el.classList.contains('activity-card') || el.classList.contains('gallery-item')) return;

      const iconEl = el.querySelector('.activity-icon');
      const titleEl = el.querySelector('h3, h4');
      const bodyEl = el.querySelector('p');
      const imgEl = el.querySelector('img');

      const hasIcon = iconEl && iconEl.textContent.trim();
      const hasImage = imgEl && imgEl.getAttribute('src');

      harvested.push({
        id:        cardState.nextLocalId--,
        page:      cardState.page,
        section,
        icon:      hasIcon ? iconEl.textContent.trim() : null,
        title:     titleEl ? titleEl.textContent.trim() : '',
        body:      bodyEl ? bodyEl.textContent.trim() : '',
        imageUrl:  hasImage ? imgEl.getAttribute('src') : null,
        sortOrder: order++
      });
    });

    // Stat boxes (for about page stats)
    container.querySelectorAll('.stat-box').forEach(el => {
      const numberEl = el.querySelector('.stat-number');
      const labelEl = el.querySelector('.stat-label');

      harvested.push({
        id:        cardState.nextLocalId--,
        page:      cardState.page,
        section,
        icon:      null,
        title:     numberEl ? numberEl.textContent.trim() : '',
        body:      labelEl ? labelEl.textContent.trim() : '',
        imageUrl:  null,
        sortOrder: order++
      });
    });
  });

  return harvested;
}

/* ══════════════════════════════════════════
   INITIALISATION
   ══════════════════════════════════════════ */

async function initCards() {
  const containers = document.querySelectorAll('[data-card-section]');
  if (containers.length === 0) return;      // page has no card grids

  // Run once. A second pass would re-harvest the static cards under fresh
  // ids while the buttons already in the DOM kept the old ones, leaving
  // every click looking up an id that no longer exists.
  if (cardState.initialised) return;
  cardState.initialised = true;

  cardState.page = resolveCardPage();

  try {
    const cards = await cardApi.list(cardState.page);
    if (!Array.isArray(cards)) {
      throw new Error('Unexpected response shape');
    }

    // An empty list is a valid answer, NOT a failure. Falling back to the
    // static HTML here would show one page's hardcoded cards under another
    // page's heading — e.g. Grade R's activities on the Grade 3 page.
    cardState.cards = cards;
    cardState.backendAvailable = true;
    renderAllSections();
    console.info(`[Cards] Loaded ${cards.length} cards for "${cardState.page}".`);

  } catch (err) {
    // Leave the hardcoded HTML exactly as it is — a visitor sees content
    // whether or not the server is running.
    cardState.backendAvailable = false;
    cardState.cards = harvestStaticCards();
    console.warn('[Cards] Backend unavailable — using the static cards in the page. '
               + 'Additions and edits will not persist. (' + err.message + ')');
    injectGhostTiles();
    decorateStaticCards();
  }

  attachCardHandlers();
}

/** Adds ghost tiles without touching the existing static markup. */
function injectGhostTiles() {
  document.querySelectorAll('[data-card-section]').forEach(container => {
    if (container.querySelector('.card-ghost')) return;
    const section = container.dataset.cardSection;
    container.insertAdjacentHTML('beforeend',
        ghostTileHtml(section, section === 'gallery'));
  });
}

/** Pairs each static card with its harvested state entry and adds its buttons. */
function decorateStaticCards() {
  document.querySelectorAll('[data-card-section]').forEach(container => {
    const section = container.dataset.cardSection;
    const stateCards = cardsIn(section);

    container.querySelectorAll('.activity-card, .gallery-item').forEach((el, index) => {
      const card = stateCards[index];
      if (!card) return;

      el.dataset.cardId = card.id;

      // Always rebuild the buttons rather than skipping when they exist —
      // stale buttons pointing at an old id are worse than no buttons,
      // because they look clickable and silently do nothing.
      const existing = el.querySelector('.card-admin-actions');
      if (existing) existing.remove();
      el.insertAdjacentHTML('beforeend', adminActionsHtml(card));
    });
  });
}

/* ══════════════════════════════════════════
   EVENT HANDLING
   ══════════════════════════════════════════ */

function attachCardHandlers() {
  document.querySelectorAll('[data-card-section]').forEach(container => {
    container.removeEventListener('click', handleGridClick);
    container.addEventListener('click', handleGridClick);

    // Drag-and-drop straight onto a gallery grid
    if (container.dataset.cardSection === 'gallery') {
      attachGridDropzone(container);
    }
  });
}

function handleGridClick(e) {
  if (!inAdminMode()) return;

  const addBtn = e.target.closest('[data-action="add"]');
  if (addBtn) {
    e.preventDefault();
    e.stopPropagation();
    openCardEditor(null, addBtn.dataset.section);
    return;
  }

  const actionBtn = e.target.closest('[data-action="edit"], [data-action="remove"]');
  if (actionBtn) {
    e.preventDefault();
    e.stopPropagation();
    const card = findCard(Number(actionBtn.dataset.cardId));
    if (!card) return;

    if (actionBtn.dataset.action === 'edit') {
      openCardEditor(card, card.section);
    } else {
      openRemoveConfirm(card);
    }
    return;
  }

  // Clicking the card itself also edits it — "either via buttons or
  // directly on cards", as specified.
  const cardEl = e.target.closest('[data-card-id]');
  if (cardEl) {
    e.preventDefault();
    e.stopPropagation();
    const card = findCard(Number(cardEl.dataset.cardId));
    if (card) openCardEditor(card, card.section);
  }
}

function findCard(id) {
  return cardState.cards.find(c => c.id === id) || null;
}

/* ══════════════════════════════════════════
   DRAG & DROP ONTO A GRID
   ══════════════════════════════════════════ */

function attachGridDropzone(container) {
  if (container.dataset.dropzoneReady === 'true') return;
  container.dataset.dropzoneReady = 'true';

  ['dragenter', 'dragover'].forEach(type => {
    container.addEventListener(type, e => {
      if (!inAdminMode() || !hasFiles(e)) return;
      e.preventDefault();
      container.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(type => {
    container.addEventListener(type, e => {
      // dragleave fires for children too — ignore unless we've really left
      if (type === 'dragleave' && container.contains(e.relatedTarget)) return;
      container.classList.remove('drag-active');
    });
  });

  container.addEventListener('drop', async e => {
    if (!inAdminMode() || !hasFiles(e)) return;
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
      showToast('That file is not an image.', 'error');
      return;
    }

    for (const file of files) {
      await addGalleryImage(file, container.dataset.cardSection);
    }
  });
}

function hasFiles(e) {
  return e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
}

/** Uploads a dropped file and creates a gallery card for it. */
async function addGalleryImage(file, section) {
  // Prevent multiple simultaneous uploads
  if (isUploading) {
    console.log('[Image Upload] Already uploading, ignoring duplicate request');
    showToast('Please wait for the current upload to finish.', 'error');
    return;
  }
  
  const validationError = validateImageFile(file);
  if (validationError) {
    showToast(validationError, 'error');
    return;
  }

  isUploading = true;
  showToast(`Uploading ${file.name}…`);

  let url;
  try {
    url = await uploadImage(file);
  } catch (err) {
    showToast(err.message, 'error');
    return;
  } finally {
    isUploading = false;
  }

  const caption = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, CARD_LIMITS.caption);

  await persistNewCard({
    page:     cardState.page,
    section,
    title:    caption || 'Untitled photo',
    imageUrl: url,
    icon:     null,
    body:     null
  });
}

function validateImageFile(file) {
  if (!file.type.startsWith('image/')) return 'That file is not an image.';
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is ${(file.size / 1048576).toFixed(1)}MB — the limit is 5MB.`;
  }
  return null;
}

/**
 * Sends the file to the backend, or falls back to an in-browser data URL
 * so the image is at least visible during a demo.
 */
async function uploadImage(file) {
  try {
    // Add timeout to prevent hanging uploads
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const uploadPromise = cardApi.upload(file);
    const result = await Promise.race([
      uploadPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 30000)
      )
    ]);
    
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    if (cardState.backendAvailable) throw err;   // real failure, surface it
    return await readAsDataUrl(file);
  }
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

/* ══════════════════════════════════════════
   PERSISTENCE
   ══════════════════════════════════════════ */

async function persistNewCard(card) {
  if (cardState.backendAvailable) {
    try {
      const saved = await cardApi.create(card);
      cardState.cards.push(saved);
      renderAllSections();
      showToast('Card added.', 'success');
      return saved;
    } catch (err) {
      showToast(err.message, 'error');
      return null;
    }
  }

  // Demo mode — keep it in memory only, and say so.
  const local = Object.assign({
    id: cardState.nextLocalId--,
    sortOrder: cardsIn(card.section).length + 1
  }, card);

  cardState.cards.push(local);
  renderAllSections();
  showToast('Card added (not saved — backend offline).');
  return local;
}

async function persistCardUpdate(card) {
  if (cardState.backendAvailable) {
    try {
      const saved = await cardApi.update(card);
      Object.assign(findCard(card.id) || {}, saved);
      renderAllSections();
      showToast('Card saved.', 'success');
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  }

  Object.assign(findCard(card.id) || {}, card);
  renderAllSections();
  showToast('Card updated (not saved — backend offline).');
  return true;
}

let isRemovingCard = false;

async function persistCardRemoval(card) {
  // Prevent multiple simultaneous removals
  if (isRemovingCard) {
    console.log('[Card Removal] Already removing a card, ignoring duplicate request');
    return false;
  }
  
  isRemovingCard = true;
  
  try {
    if (cardState.backendAvailable) {
      try {
        await cardApi.remove(card.id);
      } catch (err) {
        showToast(err.message, 'error');
        return false;
      }
    }

    // Use requestAnimationFrame for smoother DOM updates
    requestAnimationFrame(() => {
      cardState.cards = cardState.cards.filter(c => c.id !== card.id);
      renderAllSections();
    });
    
    showToast(cardState.backendAvailable
        ? 'Card removed.'
        : 'Card removed (not saved — backend offline).',
        cardState.backendAvailable ? 'success' : null);
    return true;
  } finally {
    isRemovingCard = false;
  }
}

/* ══════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════ */

let toastTimer = null;

function showToast(message, variant) {
  const toast = document.getElementById('admin-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = 'active' + (variant ? ' ' + variant : '');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = ''; }, 3200);
}

/* ══════════════════════════════════════════
   BOOT
   ══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', initCards);

// admin.js fires this when edit mode is entered or left, so freshly
// rendered cards always carry the right controls.
document.addEventListener('admin:modechange', () => {
  if (cardState.cards.length > 0) attachCardHandlers();
});
