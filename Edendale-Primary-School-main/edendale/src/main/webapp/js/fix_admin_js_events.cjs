const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');

// Replace all the initial document.getElementById to fetch inside the event handlers
js = js.replace(/const adminToggleBtn.*?getElementById\('admin-toggle-btn'\);/g, '');
js = js.replace(/const adminLoginModal.*?getElementById\('admin-login-modal'\);/g, '');
js = js.replace(/const adminCloseBtn.*?getElementById\('admin-close-btn'\);/g, '');
js = js.replace(/const adminLoginBtn.*?getElementById\('admin-login-btn'\);/g, '');
js = js.replace(/const adminLoginError.*?getElementById\('admin-login-error'\);/g, '');
js = js.replace(/const adminUsernameEl.*?getElementById\('admin-username'\);/g, '');
js = js.replace(/const adminPasswordEl.*?getElementById\('admin-password'\);/g, '');
js = js.replace(/const adminBar.*?getElementById\('admin-bar'\);/g, '');
js = js.replace(/const adminSaveBtn.*?getElementById\('admin-save-btn'\);/g, '');
js = js.replace(/const adminLogoutBtn.*?getElementById\('admin-logout-btn'\);/g, '');
js = js.replace(/const editPopup.*?getElementById\('edit-popup'\);/g, '');
js = js.replace(/const editPopupText.*?getElementById\('edit-popup-text'\);/g, '');
js = js.replace(/const editPopupImgRow.*?getElementById\('edit-popup-image-row'\);/g, '');
js = js.replace(/const editPopupImgUrl.*?getElementById\('edit-popup-image-url'\);/g, '');
js = js.replace(/const editPopupSave.*?getElementById\('edit-popup-save'\);/g, '');
js = js.replace(/const editPopupCancel.*?getElementById\('edit-popup-cancel'\);/g, '');

const newListeners = `
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
`;

// we need to remove the old event listeners.
js = js.replace(/if \(adminToggleBtn\) \{[\s\S]*?\}\n\}/g, '');
js = js.replace(/if \(adminCloseBtn\) \{[\s\S]*?hideLoginModal\);\n\}/g, '');
js = js.replace(/if \(adminLoginBtn\) \{[\s\S]*?handleLogin\);\n\}/g, '');
js = js.replace(/if \(adminLogoutBtn\) \{[\s\S]*?exitAdminMode\);\n\}/g, '');
js = js.replace(/if \(editPopupSave\) \{[\s\S]*?const isImage[\s\S]*?\}\);/g, 'function saveEdit() {\n  const editPopupText = document.getElementById("edit-popup-text");\n  const editPopupImgUrl = document.getElementById("edit-popup-image-url");\n  if (!currentEditTarget) return;\n  const field = currentEditTarget.dataset.field;\n  const isImage = currentEditTarget.dataset.type === "image";\n  const newVal = isImage ? editPopupImgUrl.value.trim() : editPopupText.value;\n  \n  if (newVal) {\n    if (isImage) currentEditTarget.src = newVal;\n    else currentEditTarget.innerHTML = newVal;\n    pendingChanges[field] = newVal;\n  }\n  hideEditPopup();\n}\n');
js = js.replace(/if \(editPopupCancel\) \{[\s\S]*?hideEditPopup\);\n\}/g, '');
js = js.replace(/if \(adminSaveBtn\) \{[\s\S]*?saveAllChanges\);\n\}/g, '');

// Also handle the password keydown logic differently
js = js.replace(/if \(adminPasswordEl\) \{[\s\S]*?handleLogin\(\);\n\s*\}\n\s*\}\);\n\}/g, '');

js = js + `
document.addEventListener('keydown', e => {
  if (e.target.matches('#admin-password') && e.key === 'Enter') {
    handleLogin();
  }
});
`;

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', newListeners + '\n' + js);
console.log("Fixed admin js event handlers");
