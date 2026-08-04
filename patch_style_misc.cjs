const fs = require('fs');

function patch(file) {
  let css = fs.readFileSync(file, 'utf8');
  css = css.replace(/\.stat-box \{\n  background: white;/g, 
`.stat-box {
  background: linear-gradient(135deg, var(--white) 0%, #e6f0fa 100%);`);
  fs.writeFileSync(file, css);
}

patch('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css');

let globalCss = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css', 'utf8');
globalCss = globalCss.replace(/\.grade-detail-content \{\n  background: white;/g,
`.grade-detail-content {
  background: linear-gradient(135deg, var(--white) 0%, #e6f0fa 100%);
  border: 2px solid var(--gold);`);
globalCss = globalCss.replace(/\.grade-detail-sidebar \{\n  background: white;/g,
`.grade-detail-sidebar {
  background: linear-gradient(135deg, var(--white) 0%, #e6f0fa 100%);
  border: 2px solid var(--gold);`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css', globalCss);

console.log("Patched style misc");
