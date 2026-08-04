const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');
js = js.replace("function showLoginModal() {\n  if (adminLoginModal) {", "function showLoginModal() {\n  const adminLoginModal = document.getElementById('admin-login-modal');\n  if (adminLoginModal) {");
fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', js);
