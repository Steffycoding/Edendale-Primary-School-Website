
document.addEventListener('click', e => {
  const adminToggleBtn = e.target.closest('#admin-toggle-btn');
  if (adminToggleBtn) {
    if (isAdminMode) {
      exitAdminMode();
    } else {
      showLoginModal();
    }
  }

  const adminCloseBtn = e.target.closest('#admin-close-btn');
  if (adminCloseBtn) {
    hideLoginModal();
  }

  const adminLoginBtn = e.target.closest('#admin-login-btn');
  if (adminLoginBtn) {
    handleLogin();
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

  const adminSaveBtn = e.target.closest('#admin-save-btn');
  if (adminSaveBtn) {
    saveAllChanges();
  }
});

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

















/* ══════════════════════════════════════════
   STATE
   ══════════════════════════════════════════ */
let isAdminMode = false;
let currentEditTarget = null;      // The element currently being edited
let pendingChanges = {};           // { fieldName: newValue } — saved on "Save All"

/* ══════════════════════════════════════════
   1. TOGGLE BUTTON → OPEN LOGIN MODAL
   ══════════════════════════════════════════ */




function showLoginModal() {
  const adminLoginModal = document.getElementById("admin-login-modal");
  const adminUsernameEl = document.getElementById("admin-username");
  if (adminLoginModal) {
    adminLoginModal.classList.add("active");
    if (adminUsernameEl) adminUsernameEl.focus();
  }
}

function showLoginModal() {
  const adminLoginModal = document.getElementById("admin-login-modal");
  const adminUsernameEl = document.getElementById("admin-username");
  if (adminLoginModal) {
    adminLoginModal.classList.add("active");
    if (adminUsernameEl) adminUsernameEl.focus();
  }
}

function hideLoginModal() {
  const adminLoginModal = document.getElementById('admin-login-modal');
  const adminLoginError = document.getElementById('admin-login-error');
  if (adminLoginModal) adminLoginModal.classList.remove('active');
  if (adminLoginError) adminLoginError.textContent = '';
}

/* ══════════════════════════════════════════
   2. LOGIN FORM SUBMIT
   ══════════════════════════════════════════ */




async function handleLogin() {
  const adminUsernameEl = document.getElementById('admin-username');
  const adminPasswordEl = document.getElementById('admin-password');
  const adminLoginError = document.getElementById('admin-login-error');
  const adminBar        = document.getElementById('admin-bar');
  
  if (!adminUsernameEl || !adminPasswordEl) return;
  const user = adminUsernameEl.value.trim();
  const pass = adminPasswordEl.value.trim();

  
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    
    if (res.ok) {
      isAdminMode = true;
      document.body.classList.add('admin-mode');
      if (adminBar) adminBar.classList.add('active');
      hideLoginModal();
      adminUsernameEl.value = '';
      adminPasswordEl.value = '';
      alert('Logged in as Admin. You can now edit content.');
    } else {
      if (adminLoginError) adminLoginError.textContent = 'Invalid credentials';
    }
  } catch (err) {
    if (adminLoginError) adminLoginError.textContent = 'Error connecting to server';
  }

}

function exitAdminMode() {
  const adminBar = document.getElementById('admin-bar');
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  if (adminBar) adminBar.classList.remove('active');
  pendingChanges = {};
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
  
  const editPopupImgRow = document.getElementById('edit-popup-image-row');
  const editPopupLinkRow = document.getElementById('edit-popup-link-row');
  const editPopupText   = document.getElementById('edit-popup-text');
  const editPopupImgUrl = document.getElementById('edit-popup-image-url');
  const editPopupLinkUrl = document.getElementById('edit-popup-link-url');
  const editPopup       = document.getElementById('edit-popup');
  
  if (isImage) {
    if (editPopupImgRow) editPopupImgRow.style.display = 'block';
    if (editPopupLinkRow) editPopupLinkRow.style.display = 'none';
    if (editPopupText) editPopupText.style.display = 'none';
    if (editPopupImgUrl) editPopupImgUrl.value = currentVal;
  } else if (isLink) {
    if (editPopupImgRow) editPopupImgRow.style.display = 'none';
    if (editPopupLinkRow) editPopupLinkRow.style.display = 'block';
    if (editPopupText) editPopupText.style.display = 'none';
    if (editPopupLinkUrl) editPopupLinkUrl.value = currentVal;
  } else {
    if (editPopupImgRow) editPopupImgRow.style.display = 'none';
    if (editPopupLinkRow) editPopupLinkRow.style.display = 'none';
    if (editPopupText) {
      editPopupText.style.display = 'block';
      editPopupText.value = currentVal;
    }
  }

  if (editPopup) editPopup.classList.add('active');
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
    if (textarea) newValue = textarea.value.trim();
  }

  // Update UI immediately
  if (isImage) {
    currentEditTarget.setAttribute('src', newValue);
  } else if (isLink) {
    currentEditTarget.setAttribute('href', newValue);
  } else {
    currentEditTarget.innerHTML = newValue;
  }

  // Save to pending changes
  pendingChanges[fieldName] = newValue;
  hideEditPopup();
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
  const editPopup = document.getElementById('edit-popup');
  if (editPopup && editPopup.classList.contains('active')) {
    if (!editPopup.contains(e.target) && e.target !== currentEditTarget) {
      hideEditPopup();
    }
  }
});

document.addEventListener('keydown', e => {
  if (e.target.matches('#admin-password') && e.key === 'Enter') {
    handleLogin();
  }
});
