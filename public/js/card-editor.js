/**
 * card-editor.js — Card Editor Dialog
 * Edendale Primary School Website
 *
 * The popup used to add and edit cards, plus the removal confirmation and
 * the toast. Kept separate from cards.js so that file stays about rendering
 * and data, and this one about the dialog.
 *
 * Two shapes, chosen by section:
 *   gallery  → image dropzone + caption
 *   anything else → emoji icon + title + description
 *
 * Every text field carries a live character counter and refuses to save when
 * over its limit, so long text can never push a card out of its layout.
 *
 * Depends on cards.js for CARD_LIMITS, ICON_SUGGESTIONS, persistNewCard,
 * persistCardUpdate, persistCardRemoval, uploadImage, validateImageFile
 * and showToast.
 */

'use strict';

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */

let editorCard    = null;   // the card being edited, or null when adding
let editorSection = null;
let editorImageUrl = null;  // pending image for gallery items
let confirmTarget = null;

/* ══════════════════════════════════════════
   CHROME INJECTION
   Built once and reused, so pages don't each
   need to carry this markup.
   ══════════════════════════════════════════ */

(function injectCardEditorChrome() {
  if (document.getElementById('card-editor')) return;

  const holder = document.createElement('div');
  holder.innerHTML = `
    <!-- CARD EDITOR -->
    <div id="card-editor" role="dialog" aria-modal="true" aria-labelledby="card-editor-title">
      <h4 id="card-editor-title">Edit Card</h4>
      <div id="card-editor-fields"></div>
      <p id="card-editor-error"></p>
      <div class="card-editor-actions">
        <button class="btn btn-primary" id="card-editor-save">Save</button>
        <button class="btn btn-outline" id="card-editor-cancel">Cancel</button>
      </div>
    </div>

    <!-- REMOVE CONFIRMATION -->
    <div id="card-confirm" role="dialog" aria-modal="true">
      <div class="card-confirm-box">
        <h4>Remove this card?</h4>
        <p id="card-confirm-text">This cannot be undone.</p>
        <div class="card-confirm-actions">
          <button class="btn-danger" id="card-confirm-yes">Remove</button>
          <button class="btn-cancel" id="card-confirm-no">Keep it</button>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div id="admin-toast" role="status" aria-live="polite"></div>
  `;

  while (holder.firstElementChild) {
    document.body.appendChild(holder.firstElementChild);
  }
})();

/* ══════════════════════════════════════════
   OPEN / CLOSE
   ══════════════════════════════════════════ */

/**
 * @param {Object|null} card    existing card, or null to add a new one
 * @param {string}      section which grid the card belongs to
 */
function openCardEditor(card, section) {
  const editor = document.getElementById('card-editor');
  if (!editor) return;

  // Close any existing edit popup before opening card editor
  const editPopup = document.getElementById('edit-popup');
  if (editPopup && editPopup.classList.contains('active')) {
    editPopup.classList.remove('active');
  }

  editorCard     = card;
  editorSection  = section;
  editorImageUrl = card ? card.imageUrl : null;

  const isGallery = section === 'gallery';
  const isStats   = section === 'stats';
  const isNew     = !card;

  document.getElementById('card-editor-title').textContent =
      (isNew ? 'Add ' : 'Edit ') + (isGallery ? 'Photo' : isStats ? 'Stat' : 'Card');

  let fieldsHtml;
  if (isGallery) {
    fieldsHtml = galleryFieldsHtml(card);
  } else if (isStats) {
    fieldsHtml = statFieldsHtml(card);
  } else if (section === 'activities' || section === 'extracurricular' || section === 'cocurricular') {
    fieldsHtml = activityFieldsHtml(card);
  } else {
    fieldsHtml = genericFieldsHtml(card);
  }

  document.getElementById('card-editor-fields').innerHTML = fieldsHtml;

  setEditorError('');
  wireCounters();
  if (isGallery) wireEditorDropzone();
  if (!isStats && !isGallery) wireIconSuggestions();

  editor.classList.add('active');

  const first = editor.querySelector('input, textarea');
  if (first) first.focus();
}

function closeCardEditor() {
  const editor = document.getElementById('card-editor');
  if (editor) editor.classList.remove('active');
  editorCard = null;
  editorSection = null;
  editorImageUrl = null;
}

/* ══════════════════════════════════════════
   FIELD TEMPLATES
   ══════════════════════════════════════════ */

function activityFieldsHtml(card) {
  const icon  = card ? (card.icon  || '') : '';
  const title = card ? (card.title || '') : '';
  const body  = card ? (card.body  || '') : '';

  return `
    <div class="card-editor-field">
      <label for="ce-icon">Icon</label>
      <div class="icon-row">
        <input type="text" id="ce-icon" value="${escapeAttr(icon)}"
               maxlength="${CARD_LIMITS.icon}" placeholder="⚽">
        <div class="icon-suggestions">
          ${ICON_SUGGESTIONS.map(e =>
            `<button type="button" class="icon-suggestion" data-icon="${e}">${e}</button>`
          ).join('')}
        </div>
      </div>
    </div>

    <div class="card-editor-field">
      <label for="ce-title">Name</label>
      <input type="text" id="ce-title" value="${escapeAttr(title)}"
             data-limit="${CARD_LIMITS.title}" placeholder="e.g. Chess Club">
      <span class="char-counter" data-for="ce-title"></span>
    </div>

    <div class="card-editor-field">
      <label for="ce-body">Description</label>
      <textarea id="ce-body" rows="6" data-limit="${CARD_LIMITS.body}"
                placeholder="What do learners do, and what do they gain from it?">${escapeText(body)}</textarea>
      <span class="char-counter" data-for="ce-body"></span>
    </div>`;
}

function galleryFieldsHtml(card) {
  const title = card ? (card.title || '') : '';
  const url   = card ? (card.imageUrl || '') : '';

  return `
    <div class="card-editor-field">
      <label>Photo</label>
      <div class="image-dropzone ${url ? 'has-image' : ''}" id="ce-dropzone" tabindex="0"
           role="button" aria-label="Choose or drop an image">
        ${url ? `<img src="${escapeAttr(resolveImageUrl(url))}" alt="">` : ''}
        <span>${url ? 'Click or drop a file to replace' : 'Click to choose an image, or drag one here'}</span>
        <span class="dropzone-hint">JPG, PNG, WEBP, GIF or SVG · up to 5MB</span>
      </div>
      <input type="file" id="ce-file" accept="image/*" hidden>
      <p class="upload-status" id="ce-upload-status"></p>
    </div>

    <div class="card-editor-field">
      <label for="ce-title">Caption</label>
      <input type="text" id="ce-title" value="${escapeAttr(title)}"
             data-limit="${CARD_LIMITS.caption}" placeholder="e.g. Outdoor Play">
      <span class="char-counter" data-for="ce-title"></span>
    </div>`;
}

function genericFieldsHtml(card) {
  const title = card ? (card.title || '') : '';
  const body  = card ? (card.body  || '') : '';

  return `
    <div class="card-editor-field">
      <label for="ce-title">Title</label>
      <input type="text" id="ce-title" value="${escapeAttr(title)}"
             data-limit="${CARD_LIMITS.title}" placeholder="e.g. Academic Excellence">
      <span class="char-counter" data-for="ce-title"></span>
    </div>

    <div class="card-editor-field">
      <label for="ce-body">Description</label>
      <textarea id="ce-body" rows="6" data-limit="${CARD_LIMITS.body}"
                placeholder="Brief description">${escapeText(body)}</textarea>
      <span class="char-counter" data-for="ce-body"></span>
    </div>`;
}

function statFieldsHtml(card) {
  const title = card ? (card.title || '') : '';
  const body  = card ? (card.body  || '') : '';

  return `
    <div class="card-editor-field">
      <label for="ce-title">Number/Value</label>
      <input type="text" id="ce-title" value="${escapeAttr(title)}"
             data-limit="${CARD_LIMITS.title}" placeholder="e.g. 400+">
      <span class="char-counter" data-for="ce-title"></span>
    </div>

    <div class="card-editor-field">
      <label for="ce-body">Label</label>
      <input type="text" id="ce-body" value="${escapeAttr(body)}"
             data-limit="${CARD_LIMITS.body}" placeholder="e.g. Learners">
      <span class="char-counter" data-for="ce-body"></span>
    </div>`;
}

function escapeAttr(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ══════════════════════════════════════════
   CHARACTER COUNTERS — the "constraints"
   ══════════════════════════════════════════ */

function wireCounters() {
  document.querySelectorAll('#card-editor [data-limit]').forEach(field => {
    const counter = document.querySelector(`#card-editor .char-counter[data-for="${field.id}"]`);
    if (!counter) return;

    const update = () => {
      const limit = Number(field.dataset.limit);
      const used  = field.value.length;

      counter.textContent = `${used} / ${limit}`;
      counter.classList.toggle('over', used > limit);
      counter.classList.toggle('warn', used <= limit && used >= limit * 0.8);

      refreshSaveState();
    };

    field.addEventListener('input', update);
    update();
  });
}

/** Disables Save while any field is over its limit. */
function refreshSaveState() {
  const saveBtn = document.getElementById('card-editor-save');
  if (!saveBtn) return;

  const over = Array.from(document.querySelectorAll('#card-editor [data-limit]'))
      .some(f => f.value.length > Number(f.dataset.limit));

  saveBtn.disabled = over;
  setEditorError(over ? 'Some text is too long — shorten it to save.' : '');
}

function setEditorError(msg) {
  const el = document.getElementById('card-editor-error');
  if (el) el.textContent = msg;
}

/* ══════════════════════════════════════════
   ICON QUICK-PICKS
   ══════════════════════════════════════════ */

function wireIconSuggestions() {
  document.querySelectorAll('#card-editor .icon-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById('ce-icon');
      if (input) {
        input.value = btn.dataset.icon;
        input.focus();
      }
    });
  });
}

/* ══════════════════════════════════════════
   IMAGE DROPZONE (inside the editor)
   ══════════════════════════════════════════ */

function wireEditorDropzone() {
  const zone   = document.getElementById('ce-dropzone');
  const input  = document.getElementById('ce-file');
  const status = document.getElementById('ce-upload-status');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });

  input.addEventListener('change', () => {
    if (input.files && input.files[0]) handleEditorFile(input.files[0]);
  });

  ['dragenter', 'dragover'].forEach(type => {
    zone.addEventListener(type, e => { e.preventDefault(); zone.classList.add('drag-active'); });
  });
  ['dragleave', 'drop'].forEach(type => {
    zone.addEventListener(type, () => zone.classList.remove('drag-active'));
  });

  zone.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleEditorFile(file);
  });

  function setStatus(msg, variant) {
    if (!status) return;
    status.textContent = msg;
    status.className = 'upload-status' + (variant ? ' ' + variant : '');
  }

  async function handleEditorFile(file) {
    const problem = validateImageFile(file);
    if (problem) { setStatus(problem, 'error'); return; }

    setStatus('Uploading…');
    try {
      editorImageUrl = await uploadImage(file);
      zone.classList.add('has-image');
      zone.innerHTML =
          `<img src="${escapeAttr(editorImageUrl)}" alt="">` +
          `<span>Click or drop a file to replace</span>` +
          `<span class="dropzone-hint">JPG, PNG, WEBP, GIF or SVG · up to 5MB</span>`;
      setStatus('Image ready — press Save to apply.', 'success');

      // No re-binding needed: the assignment above replaced only the zone's
      // children, and every listener is attached to the zone itself.

      // Suggest a caption from the filename when the field is still empty
      const titleField = document.getElementById('ce-title');
      if (titleField && !titleField.value.trim()) {
        titleField.value = file.name
            .replace(/\.[^.]+$/, '')
            .replace(/[-_]+/g, ' ')
            .slice(0, CARD_LIMITS.caption);
        titleField.dispatchEvent(new Event('input'));
      }
    } catch (err) {
      setStatus(err.message, 'error');
    }
  }
}

/* ══════════════════════════════════════════
   SAVE
   ══════════════════════════════════════════ */

async function saveCardEditor() {
  const titleField = document.getElementById('ce-title');
  const title = titleField ? titleField.value.trim() : '';

  if (!title) {
    setEditorError(editorSection === 'gallery'
        ? 'Give the photo a caption.'
        : editorSection === 'stats'
        ? 'Enter a number or value.'
        : 'Give the card a name.');
    return;
  }

  if (editorSection === 'gallery' && !editorImageUrl) {
    setEditorError('Choose an image first.');
    return;
  }

  const iconField = document.getElementById('ce-icon');
  const bodyField = document.getElementById('ce-body');

  const payload = {
    page:     cardState.page,
    section:  editorSection,
    title,
    icon:     iconField ? iconField.value.trim() || null : null,
    body:     bodyField ? bodyField.value.trim() || null : null,
    imageUrl: editorImageUrl || null
  };

  const saveBtn = document.getElementById('card-editor-save');
  if (saveBtn) saveBtn.disabled = true;

  let ok;
  if (editorCard) {
    payload.id        = editorCard.id;
    payload.sortOrder = editorCard.sortOrder;
    ok = await persistCardUpdate(payload);
  } else {
    ok = !!(await persistNewCard(payload));
  }

  if (saveBtn) saveBtn.disabled = false;
  if (ok) closeCardEditor();
}

/* ══════════════════════════════════════════
   REMOVE CONFIRMATION
   ══════════════════════════════════════════ */

function openRemoveConfirm(card) {
  const dialog = document.getElementById('card-confirm');
  if (!dialog) return;

  confirmTarget = card;
  document.getElementById('card-confirm-text').textContent =
      `"${card.title}" will be removed from the page. This cannot be undone.`;
  dialog.classList.add('active');
}

function closeRemoveConfirm() {
  const dialog = document.getElementById('card-confirm');
  if (dialog) dialog.classList.remove('active');
  confirmTarget = null;
}

/* ══════════════════════════════════════════
   WIRING
   ══════════════════════════════════════════ */

document.addEventListener('click', e => {
  if (e.target.closest('#card-editor-save'))   { saveCardEditor(); return; }
  if (e.target.closest('#card-editor-cancel')) { closeCardEditor(); return; }
  if (e.target.closest('#card-confirm-no'))    { closeRemoveConfirm(); return; }

  if (e.target.closest('#card-confirm-yes')) {
    const card = confirmTarget;
    closeRemoveConfirm();
    if (card) persistCardRemoval(card);
    return;
  }

  // Clicking the dimmed backdrop cancels the removal
  if (e.target.id === 'card-confirm') closeRemoveConfirm();
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('card-confirm')?.classList.contains('active')) {
    closeRemoveConfirm();
  } else if (document.getElementById('card-editor')?.classList.contains('active')) {
    closeCardEditor();
  }
});

// Close card editor on scroll to prevent it from following content
let cardEditorScrollTimeout;
window.addEventListener('scroll', () => {
  const cardEditor = document.getElementById('card-editor');
  if (cardEditor && cardEditor.classList.contains('active')) {
    clearTimeout(cardEditorScrollTimeout);
    cardEditorScrollTimeout = setTimeout(() => {
      closeCardEditor();
    }, 150); // Small delay to avoid closing on minor scrolls
  }
});
