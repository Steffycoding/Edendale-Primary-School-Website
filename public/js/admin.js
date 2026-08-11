
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
    }
  } catch (err) {
    console.error('Error checking admin status:', err);
  }
}

async function exitAdminMode() {
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  const adminBar = document.getElementById('admin-bar');
  if (adminBar) adminBar.classList.remove('active');
  pendingChanges = {};
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
    if (textarea) newValue = textarea.innerHTML.trim();
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
