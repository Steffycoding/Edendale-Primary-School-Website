
'use strict';

let isAdminMode = false;
let currentEditTarget = null;
let pendingChanges = {};

async function checkAdminStatus() {
  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/api/admin/status', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.admin) {
      isAdminMode = true;
      document.body.classList.add('admin-mode');
      const adminBar = document.getElementById('admin-bar');
      if (adminBar) adminBar.classList.add('active');
      const adminNavLink = document.getElementById('admin-nav-link');
      if (adminNavLink) adminNavLink.parentElement.style.display = 'none';
      const adminToggleBtn = document.getElementById('admin-toggle-btn');
      if (adminToggleBtn) adminToggleBtn.style.display = 'none';
      notifyModeChange();
    }
  } catch (err) {
    console.error('Error checking admin status:', err);
  }
}

/** Lets cards.js attach or drop its controls when edit mode is toggled. */
function notifyModeChange() {
  document.dispatchEvent(new CustomEvent('admin:modechange', {
    detail: { active: isAdminMode }
  }));
}

async function exitAdminMode() {
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  const adminBar = document.getElementById('admin-bar');
  if (adminBar) adminBar.classList.remove('active');
  pendingChanges = {};
  notifyModeChange();
  try {
    const token = localStorage.getItem('adminToken');
  await fetch('/api/admin/logout', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token } });
  localStorage.removeItem('adminToken');
    window.location.reload();
  } catch (err) {
    console.error(err);
  }
}

function handleEditClick(e) {
  if (!isAdminMode) return;
  e.preventDefault();
  currentEditTarget = e.currentTarget;
  const isImage = currentEditTarget.dataset.type === 'image';
  const isLink = currentEditTarget.dataset.type === 'link';
  let currentVal = currentEditTarget.innerHTML;
  if (isImage) currentVal = currentEditTarget.getAttribute('src');
  if (isLink) currentVal = currentEditTarget.getAttribute('href');
  
  const editPopupToolbar = document.getElementById('edit-popup-toolbar');
  const editPopupImgRow = document.getElementById('edit-popup-image-row');
  const editPopupLinkRow = document.getElementById('edit-popup-link-row');
  const editPopupText   = document.getElementById('edit-popup-text');
  const editPopupImgUrl = document.getElementById('edit-popup-image-url');
  const editPopupLinkUrl = document.getElementById('edit-popup-link-url');
  const editPopup       = document.getElementById('edit-popup');
  
  if (isImage) {
    if (editPopupToolbar) editPopupToolbar.style.display = 'none';
    if (editPopupImgRow) editPopupImgRow.style.display = 'block';
    if (editPopupLinkRow) editPopupLinkRow.style.display = 'none';
    if (editPopupText) editPopupText.style.display = 'none';
    if (editPopupImgUrl) editPopupImgUrl.value = currentVal;
  } else if (isLink) {
    if (editPopupToolbar) editPopupToolbar.style.display = 'none';
    if (editPopupImgRow) editPopupImgRow.style.display = 'none';
    if (editPopupLinkRow) editPopupLinkRow.style.display = 'block';
    if (editPopupText) editPopupText.style.display = 'none';
    if (editPopupLinkUrl) editPopupLinkUrl.value = currentVal;
  } else {
    if (editPopupToolbar) editPopupToolbar.style.display = 'flex';
    if (editPopupImgRow) editPopupImgRow.style.display = 'none';
    if (editPopupLinkRow) editPopupLinkRow.style.display = 'none';
    if (editPopupText) {
      editPopupText.style.display = 'block';
      editPopupText.innerHTML = currentVal;
    }
  }

  applyEditLimit(currentEditTarget, isImage || isLink);

  if (editPopup) {
    editPopup.classList.add('active');
    positionEditPopup(editPopup, currentEditTarget);
  }
}

/**
 * Places the popup next to the element being edited.
 *
 * #edit-popup is position:fixed with no top/left of its own, and the markup
 * sits at the very end of <body>. Left alone it resolves to its static
 * position — below the footer — which on a long page is off the screen
 * entirely: the popup opens, but nobody can see it.
 *
 * Offsets are viewport-relative because the element is fixed, so scroll
 * position must NOT be added here.
 */
function positionEditPopup(popup, target) {
  const rect = target.getBoundingClientRect();
  const margin = 8;

  // Measured after .active has made it displayable, or both are 0.
  const width = popup.offsetWidth;
  const height = popup.offsetHeight;

  // Prefer just below the element; flip above when that would overflow.
  let top = rect.bottom + margin;
  if (top + height > window.innerHeight - margin) {
    top = rect.top - height - margin;
  }
  // Still no room either way (element taller than the viewport) — pin it.
  top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));

  const left = Math.max(margin,
      Math.min(rect.left, window.innerWidth - width - margin));

  popup.style.top = top + 'px';
  popup.style.left = left + 'px';
}

/* ══════════════════════════════════════════
   LENGTH CONSTRAINTS
   ══════════════════════════════════════════ */

/**
 * Counts what the visitor actually sees. The popup is a contenteditable div,
 * so innerHTML would include the markup the toolbar inserts (<b>, <ul>…) and
 * a bolded word would eat into the budget for no visible reason.
 */
function editPopupTextLength() {
  const el = document.getElementById('edit-popup-text');
  return el ? el.textContent.length : 0;
}

// Held so the previous listener can actually be removed — passing a freshly
// built closure to removeEventListener matches nothing and the handlers pile
// up, one more on every edit.
let editLimitHandler = null;

/**
 * Wires the character counter for an element carrying data-limit, so a long
 * title cannot overflow the header it sits in. The counter is created on
 * demand, so pages need no extra markup, and elements without data-limit stay
 * unconstrained exactly as before.
 */
function applyEditLimit(el, skip) {
  const textEl = document.getElementById('edit-popup-text');
  if (!textEl) return;

  if (editLimitHandler) {
    textEl.removeEventListener('input', editLimitHandler);
    editLimitHandler = null;
  }

  const limit = Number(el.dataset.limit);
  let counter = document.getElementById('edit-popup-counter');

  if (skip || !limit || Number.isNaN(limit)) {
    if (counter) counter.style.display = 'none';
    setContentSaveDisabled(false);
    return;
  }

  if (!counter) {
    counter = document.createElement('span');
    counter.id = 'edit-popup-counter';
    counter.className = 'char-counter';
    textEl.insertAdjacentElement('afterend', counter);
  }
  counter.style.display = 'block';

  editLimitHandler = () => {
    const used = editPopupTextLength();
    counter.textContent = `${used} / ${limit}`;
    counter.classList.toggle('over', used > limit);
    counter.classList.toggle('warn', used <= limit && used >= limit * 0.8);
    setContentSaveDisabled(used > limit);
  };

  textEl.addEventListener('input', editLimitHandler);
  editLimitHandler();
}

function setContentSaveDisabled(disabled) {
  const saveBtn = document.getElementById('edit-popup-save');
  if (saveBtn) saveBtn.disabled = disabled;
}

function saveEdit() {
  if (!currentEditTarget) return;
  const isImage = currentEditTarget.dataset.type === 'image';
  const isLink = currentEditTarget.dataset.type === 'link';
  const fieldName = currentEditTarget.dataset.field;
  let newValue = '';
  
  if (isImage) {
    const input = document.getElementById('edit-popup-image-url');
    if (input) newValue = input.value.trim();
  } else if (isLink) {
    const input = document.getElementById('edit-popup-link-url');
    if (input) newValue = input.value.trim();
  } else {
    const textarea = document.getElementById('edit-popup-text');
    if (textarea) newValue = textarea.innerHTML.trim();

    // The disabled button is the visible cue; this is what actually stops an
    // over-length save (a paste can outrun the input event).
    const limit = Number(currentEditTarget.dataset.limit);
    if (limit && editPopupTextLength() > limit) return;
  }

  if (isImage) {
    currentEditTarget.setAttribute('src', newValue);
  } else if (isLink) {
    currentEditTarget.setAttribute('href', newValue);
  } else {
    currentEditTarget.innerHTML = newValue;
  }
  
  pendingChanges[fieldName] = newValue;
  hideEditPopup();
}


function undoChanges() {
  if (Object.keys(pendingChanges).length === 0) {
    alert('No unsaved changes to undo.');
    return;
  }
  let page = window.location.pathname.split('/').pop().replace('.html', '');
  if (!page || page === 'index') page = 'home';
  
  const saved = localStorage.getItem(`initialContent_${page}`);
  if (saved) {
    const data = JSON.parse(saved);
    
    // Revert pending changes
    for (const field of Object.keys(pendingChanges)) {
       const el = document.querySelector(`[data-field="${field}"]`);
       if (!el) continue;
       
       const originalValue = data[field];
       if (originalValue !== undefined) {
         if (el.dataset.type === 'image') {
           el.setAttribute('src', originalValue);
         } else if (el.dataset.type === 'link') {
           el.setAttribute('href', originalValue);
         } else {
           el.innerHTML = originalValue;
         }
       }
    }
    pendingChanges = {};
    alert('Unsaved changes reverted.');
  } else {
    // Fallback
    window.location.reload();
  }
}

function hideEditPopup() {
  const editPopup = document.getElementById('edit-popup');
  if (editPopup) editPopup.classList.remove('active');
  currentEditTarget = null;
}

async function saveAllChanges() {
  if (Object.keys(pendingChanges).length === 0) {
    alert('No changes to save.');
    return;
  }
  let page = window.location.pathname.split('/').pop().replace('.html', '');
  if (!page || page === 'index') page = 'home';
  
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ page, changes: pendingChanges })
    });
    
    if (response.ok) {
      alert('Changes saved successfully!');
      pendingChanges = {};
    } else {
      alert('Failed to save changes. Please try again.');
    }
  } catch (err) {
    console.warn('[Admin] Backend not reachable — changes logged to console only.');
    console.table(pendingChanges);
    alert('(Dev mode) Changes logged to console. Connect backend to persist.');
    pendingChanges = {};
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAdminStatus();
  
  document.addEventListener('click', e => {
    
    const editPopupToolbarBtn = e.target.closest('#edit-popup-toolbar button');
    if (editPopupToolbarBtn) {
      e.preventDefault();
      const cmd = editPopupToolbarBtn.dataset.cmd;
      document.execCommand(cmd, false, null);
      // Ensure the contenteditable div stays focused
      document.getElementById('edit-popup-text').focus();
      return;
    }

    const adminLogoutBtn = e.target.closest('#admin-logout-btn');
    if (adminLogoutBtn) {
      exitAdminMode();
    }
    const editPopupSave = e.target.closest('#edit-popup-save');
    if (editPopupSave) {
      saveEdit();
    }
    const editPopupCancel = e.target.closest('#edit-popup-cancel');
    if (editPopupCancel) {
      hideEditPopup();
    }
    const adminUndoBtn = e.target.closest('#admin-undo-btn');
    if (adminUndoBtn) {
      undoChanges();
    }
    const adminSaveBtn = e.target.closest('#admin-save-btn');
    if (adminSaveBtn) {
      saveAllChanges();
    }
    
    const editPopup = document.getElementById('edit-popup');
    if (editPopup && editPopup.classList.contains('active')) {
      if (!editPopup.contains(e.target) && e.target !== currentEditTarget && !e.target.closest('[data-editable]')) {
        hideEditPopup();
      }
    }
  });
  
  document.querySelectorAll('[data-editable]').forEach(el => {
    el.addEventListener('click', handleEditClick);
  });
});
