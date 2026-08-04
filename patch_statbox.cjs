const fs = require('fs');

function patch(file) {
  let css = fs.readFileSync(file, 'utf8');
  css = css.replace(/\.stat-box \{\n  background: white;/g, 
`.stat-box {
  background: linear-gradient(135deg, var(--white) 0%, #e6f0fa 100%);`);
  fs.writeFileSync(file, css);
}

patch('Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css');
console.log("Patched statbox");
