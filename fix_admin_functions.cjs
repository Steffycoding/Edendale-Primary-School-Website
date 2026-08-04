const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');

js = js.replace(/function showLoginModal\(\) \{[\s\S]*?adminUsernameEl\.focus\(\);\n\s*\}/, `function showLoginModal() {
  const adminLoginModal = document.getElementById('admin-login-modal');
  const adminUsernameEl = document.getElementById('admin-username');
  if (adminLoginModal) {
    adminLoginModal.classList.add('active');
    if (adminUsernameEl) adminUsernameEl.focus();
  }
}`);

js = js.replace(/function hideLoginModal\(\) \{[\s\S]*?textContent = '';\n\}/, `function hideLoginModal() {
  const adminLoginModal = document.getElementById('admin-login-modal');
  const adminLoginError = document.getElementById('admin-login-error');
  if (adminLoginModal) adminLoginModal.classList.remove('active');
  if (adminLoginError) adminLoginError.textContent = '';
}`);

js = js.replace(/function handleLogin\(\) \{[\s\S]*?function exitAdminMode/, `function handleLogin() {
  const adminUsernameEl = document.getElementById('admin-username');
  const adminPasswordEl = document.getElementById('admin-password');
  const adminLoginError = document.getElementById('admin-login-error');
  const adminBar        = document.getElementById('admin-bar');
  
  if (!adminUsernameEl || !adminPasswordEl) return;
  const user = adminUsernameEl.value.trim();
  const pass = adminPasswordEl.value.trim();

  if (user === 'admin' && pass === 'edendale2024') {
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
}

function exitAdminMode`);

js = js.replace(/function exitAdminMode\(\) \{[\s\S]*?function handleEditClick/, `function exitAdminMode() {
  const adminBar = document.getElementById('admin-bar');
  isAdminMode = false;
  document.body.classList.remove('admin-mode');
  if (adminBar) adminBar.classList.remove('active');
  pendingChanges = {};
}

function handleEditClick`);

js = js.replace(/function handleEditClick\(e\) \{[\s\S]*?function hideEditPopup/, `function handleEditClick(e) {
  if (!isAdminMode) return;
  e.preventDefault();
  currentEditTarget = e.currentTarget;
  const isImage = currentEditTarget.dataset.type === 'image';
  const currentVal = isImage ? currentEditTarget.getAttribute('src') : currentEditTarget.innerHTML;
  
  const editPopupImgRow = document.getElementById('edit-popup-image-row');
  const editPopupText   = document.getElementById('edit-popup-text');
  const editPopupImgUrl = document.getElementById('edit-popup-image-url');
  const editPopup       = document.getElementById('edit-popup');
  
  if (isImage) {
    if (editPopupImgRow) editPopupImgRow.style.display = 'block';
    if (editPopupText) editPopupText.style.display = 'none';
    if (editPopupImgUrl) editPopupImgUrl.value = currentVal;
  } else {
    if (editPopupImgRow) editPopupImgRow.style.display = 'none';
    if (editPopupText) {
      editPopupText.style.display = 'block';
      editPopupText.value = currentVal;
    }
  }

  if (editPopup) editPopup.classList.add('active');
}

function hideEditPopup`);

js = js.replace(/function hideEditPopup\(\) \{[\s\S]*?function saveAllChanges/, `function hideEditPopup() {
  const editPopup = document.getElementById('edit-popup');
  if (editPopup) editPopup.classList.remove('active');
  currentEditTarget = null;
}

function saveAllChanges`);

js = js.replace(/function saveAllChanges\(\) \{[\s\S]*?alert\('All changes saved successfully!'\);\n\}/, `function saveAllChanges() {
  const keys = Object.keys(pendingChanges);
  if (keys.length === 0) {
    alert('No changes to save.');
    return;
  }
  console.log('Saving changes:', pendingChanges);
  pendingChanges = {};
  alert('All changes saved successfully!');
}`);

// Delete the console.log line I added
js = js.replace(/console\.log\('adminToggleBtn:'.*?\n/, '');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', js);
console.log("Fixed admin js functions");
