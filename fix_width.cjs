const fs = require('fs');

function fix(file) {
  let css = fs.readFileSync(file, 'utf8');
  css = css.replace(/\.why-card \{\n  min-height: 180px;\n\}/, '.why-card {\n  min-height: 180px;\n  width: 100%;\n}');
  fs.writeFileSync(file, css);
}

fix('Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css');
fix('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css');
console.log("Fixed why-card width");
