/**
 * admin.js — Admin Edit Mode Logic
 * Edendale Primary School Website
 *
 * Flow:
 *  1. Hidden gear icon (top-right) click → show login modal
 *  2. Admin enters credentials → POST to /api/admin/login
 *  3. On success → enter edit mode (body.admin-mode)
 *  4. Click any [data-editable] element → open edit popup
 *  5. Save → PATCH to /api/content with field + new value
 *  6. Logout → exit edit mode
 */

'use strict';

/* ══════════════════════════════════════════
   ELEMENT REFERENCES
   ══════════════════════════════════════════ */
const adminToggleBtn  = document.getElementById('admin-toggle-btn');
const adminLoginModal = document.getElementById('admin-login-modal');
const adminCloseBtn = document.getElementById('admin-close-btn');
const adminLoginBtn   = document.getElementById('admin-login-btn');
const adminLoginError = document.getElementById('admin-login-error');
const adminUsernameEl = document.getElementById('admin-username');
const adminPasswordEl = document.getElementById('admin-password');
const adminBar        = document.getElementById('admin-bar');
const adminSaveBtn    = document.getElementById('admin-save-btn');
const adminLogoutBtn  = document.getElementById('admin-logout-btn');
const editPopup       = document.getElementById('edit-popup');
const editPopupText   = document.getElementById('edit-popup-text');
const editPopupImgRow = document.getElementById('edit-popup-image-row');
const editPopupImgUrl = document.getElementById('edit-popup-image-url');
const editPopupSave   = document.getElementById('edit-popup-save');
const editPopupCancel = document.getElementById('edit-popup-cancel');

/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
let isAdminMode = false;
let currentEditTarget = null;      // The element currently being edited
let pendingChanges = {};           // { fieldName: newValue } — saved on "Save All"

/* ══════════════════════════════════════════
   1. TOGGLE BUTTON → OPEN LOGIN MODAL
   ══════════════════════════════════════════ */
if (adminToggleBtn) {
  adminToggleBtn.addEventListener('click', () => {
    if (isAdminMode) {
      exitAdminMode();
    } else {
      showLoginModal();
    }
  });
}

function showLoginModal() {
  if (adminLoginModal) {
    adminLoginModal.classList.add('active');
    adminUsernameEl && adminUsernameEl.focus();
  }
}

if (adminCloseBtn) {
  adminCloseBtn.addEventListener('click', hideLoginModal);
}

function hideLoginModal() {
  if (adminLoginModal) adminLoginModal.classList.remove('active');
  if (adminLoginError) adminLoginError.textContent = '';
}

/* ══════════════════════════════════════════
   2. LOGIN FORM SUBMIT
   ══════════════════════════════════════════ */
if (adminLoginBtn) {
  adminLoginBtn.addEventListener('click', handleLogin);
}

// Allow Enter key in password field
if (adminPasswordEl) {
  adminPasswordEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
}

async function handleLogin() {
  const username = adminUsernameEl ? adminUsernameEl.value.trim() : '';
  const password = adminPasswordEl ? adminPasswordEl.value : '';

  if (!username || !password) {
    showLoginError('Please enter username and password.');
    return;
  }

  try {
    // TODO: Replace with actual endpoint once Java backend is ready
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      hideLoginModal();
      enterAdminMode();
    } else {
      showLoginError('Invalid credentials. Please try again.');
    }
  } catch (err) {
    console.warn('[Admin] Backend not reachable — using dev fallback login.');

    if (username === 'teacher' && password === 'kennis2026') {
      hideLoginModal();
      enterAdminMode();
    } else {
      showLoginError('Invalid credentials.');
    }
  }
}

function showLoginError(msg) {
  if (adminLoginError) adminLoginError.textContent = msg;
}

/* ══════════════════════════════════════════
   3. ENTER / EXIT ADMIN MODE
   ══════════════════════════════════════════ */
function enterAdminMode() {
  isAdminMode = true;
  document.body.classList.add('admin-mode');
  if (adminBar) adminBar.classList.add('active');

  // Show "Add Event" button on events page
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'inline-block');

  attachEditListeners();
  console.info('[Admin] Edit mode activated.');
}

function exitAdminMode() {
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  if (adminBar) adminBar.classList.remove('active');
  hideEditPopup();
  pendingChanges = {};

  document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');

  // TODO: POST to /api/admin/logout
  console.info('[Admin] Edit mode deactivated.');
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', exitAdminMode);
}

/* ══════════════════════════════════════════
   4. EDITABLE ELEMENT CLICK → OPEN POPUP
   ══════════════════════════════════════════ */
function attachEditListeners() {
  document.querySelectorAll('[data-editable]').forEach(el => {
    // Prevent duplicate listeners
    el.removeEventListener('click', handleEditClick);
    el.addEventListener('click', handleEditClick);
  });
}

function handleEditClick(e) {
  if (!isAdminMode) return;
  e.preventDefault();
  e.stopPropagation();
  currentEditTarget = e.currentTarget;
  openEditPopup(currentEditTarget);
}

function openEditPopup(el) {
  if (!editPopup) return;

  const isImage = el.dataset.type === 'image';

  editPopupText.style.display    = isImage ? 'none'  : 'block';
  editPopupImgRow.style.display  = isImage ? 'block' : 'none';

  if (isImage) {
    editPopupImgUrl.value = el.src || '';
  } else {
    editPopupText.value = el.innerHTML.trim();
  }

  // Position popup near the clicked element
  const rect = el.getBoundingClientRect();
  editPopup.style.top  = Math.min(rect.bottom + window.scrollY + 8,
                                   window.scrollY + window.innerHeight - 280) + 'px';
  editPopup.style.left = Math.min(rect.left, window.innerWidth - 380) + 'px';

  editPopup.classList.add('active');
}

function hideEditPopup() {
  if (editPopup) editPopup.classList.remove('active');
  currentEditTarget = null;
}

/* ══════════════════════════════════════════
   5. SAVE INDIVIDUAL EDIT
   ══════════════════════════════════════════ */
if (editPopupSave) {
  editPopupSave.addEventListener('click', () => {
    if (!currentEditTarget) return;

    const field   = currentEditTarget.dataset.field;
    const isImage = currentEditTarget.dataset.type === 'image';
    const newVal  = isImage ? editPopupImgUrl.value.trim() : editPopupText.value;

    // Apply visually
    if (isImage) {
      currentEditTarget.src = newVal;
    } else {
      currentEditTarget.innerHTML = newVal;
    }

    // Queue for bulk save
    pendingChanges[field] = newVal;

    hideEditPopup();
  });
}

if (editPopupCancel) {
  editPopupCancel.addEventListener('click', hideEditPopup);
}

/* ══════════════════════════════════════════
   6. SAVE ALL CHANGES → POST TO BACKEND
   ══════════════════════════════════════════ */
if (adminSaveBtn) {
  adminSaveBtn.addEventListener('click', saveAllChanges);
}

async function saveAllChanges() {
  if (Object.keys(pendingChanges).length === 0) {
    alert('No changes to save.');
    return;
  }

  // Determine current page
  const page = window.location.pathname.split('/').pop().replace('.html', '') || 'home';

  try {
    const response = await fetch('/api/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, changes: pendingChanges })
    });

    if (response.ok) {
      alert('Changes saved successfully!');
      pendingChanges = {};
    } else {
      alert('Failed to save changes. Please try again.');
    }
  } catch (err) {
    // ── DEV FALLBACK ──
    console.warn('[Admin] Backend not reachable — changes logged to console only.');
    console.table(pendingChanges);
    alert('(Dev mode) Changes logged to console. Connect backend to persist.');
    pendingChanges = {};
  }
}

/* ══════════════════════════════════════════
   7. CLOSE POPUP ON OUTSIDE CLICK
   ══════════════════════════════════════════ */
document.addEventListener('click', e => {
  if (editPopup && editPopup.classList.contains('active')) {
    if (!editPopup.contains(e.target) && e.target !== currentEditTarget) {
      hideEditPopup();
    }
  }
});
