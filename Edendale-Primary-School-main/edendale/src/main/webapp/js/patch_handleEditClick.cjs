const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');

js = js.replace(/function handleEditClick\(e\) \{[\s\S]*?if \(editPopup\) editPopup\.classList\.add\('active'\);\n\}/, `function handleEditClick(e) {
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
}`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', js);
console.log("Patched handleEditClick");
