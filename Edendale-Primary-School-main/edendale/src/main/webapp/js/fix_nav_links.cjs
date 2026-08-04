const fs = require('fs');

function fix(file) {
  let css = fs.readFileSync(file, 'utf8');
  // Add !important to mobile link colors to overcome global.css
  css = css.replace(/color: var\(--text-dark\);/g, 'color: var(--text-dark) !important;');
  fs.writeFileSync(file, css);
}

fix('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css');
console.log("Fixed link colors");
