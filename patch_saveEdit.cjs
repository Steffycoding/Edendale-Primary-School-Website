const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');

if (!js.includes('function saveEdit')) {
  const saveEditFunc = `
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
`;
  js = js.replace('function hideEditPopup() {', saveEditFunc + '\nfunction hideEditPopup() {');
  fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', js);
  console.log("Added saveEdit");
} else {
  console.log("saveEdit already exists");
}
