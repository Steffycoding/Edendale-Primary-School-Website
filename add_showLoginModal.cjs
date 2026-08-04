const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');
js = js.replace('function hideLoginModal() {', 'function showLoginModal() {\n  const adminLoginModal = document.getElementById("admin-login-modal");\n  const adminUsernameEl = document.getElementById("admin-username");\n  if (adminLoginModal) {\n    adminLoginModal.classList.add("active");\n    if (adminUsernameEl) adminUsernameEl.focus();\n  }\n}\n\nfunction hideLoginModal() {');
fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', js);
