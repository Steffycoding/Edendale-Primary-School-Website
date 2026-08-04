const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', 'utf8');

css = css.replace(/\.grade-detail-content \{\n  background: white;/g,
`.grade-detail-content {
  background: linear-gradient(135deg, var(--white) 0%, #e6f0fa 100%);
  border: 2px solid var(--gold);`);
  
css = css.replace(/\.grade-detail-sidebar \{\n  background: white;/g,
`.grade-detail-sidebar {
  background: linear-gradient(135deg, var(--white) 0%, #e6f0fa 100%);
  border: 2px solid var(--gold);`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', css);
console.log("Patched admin cards");
