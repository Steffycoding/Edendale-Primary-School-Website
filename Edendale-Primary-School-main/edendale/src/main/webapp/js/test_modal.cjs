const fs = require('fs');
const js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');
console.log(js.includes("document.addEventListener('click'"));
console.log(js.includes("const adminToggleBtn = e.target.closest('#admin-toggle-btn')"));
