const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');
js = js.replace("document.addEventListener('click', e => {\n  if (editPopup && editPopup.classList.contains('active')) {\n    if (!editPopup.contains(e.target) && e.target !== currentEditTarget) {\n      hideEditPopup();\n    }\n  }\n});", "document.addEventListener('click', e => {\n  const editPopup = document.getElementById('edit-popup');\n  if (editPopup && editPopup.classList.contains('active')) {\n    if (!editPopup.contains(e.target) && e.target !== currentEditTarget) {\n      hideEditPopup();\n    }\n  }\n});");
fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', js);
