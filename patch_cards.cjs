const fs = require('fs');

function patch(file) {
  let css = fs.readFileSync(file, 'utf8');
  css = css.replace(/\.card \{\n  background: white;\n  border-radius: 18px;\n  box-shadow: var\(--shadow\);\n  overflow: hidden;\n\}/, 
`.card {
  background: linear-gradient(135deg, var(--white) 0%, #e6f0fa 100%);
  border: 2px solid var(--gold);
  border-radius: 18px;
  box-shadow: var(--shadow);
  overflow: hidden;
}`);
  fs.writeFileSync(file, css);
}

patch('Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css');
patch('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css');
console.log("Patched cards");
