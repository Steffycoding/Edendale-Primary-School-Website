const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');
js = js.replace("if (adminToggleBtn) {", "console.log('adminToggleBtn:', adminToggleBtn, 'adminLoginModal:', adminLoginModal);\nif (adminToggleBtn) {");
fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', js);
