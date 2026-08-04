const fs = require('fs');

function patch(file) {
  let css = fs.readFileSync(file, 'utf8');
  css = css.replace(/background: linear-gradient\(135deg, var\(--white\) 0%, #e6f0fa 100%\);/g, 
  'background: linear-gradient(135deg, #f0f7ff 0%, #dbeafe 100%) !important;');
  fs.writeFileSync(file, css);
}

patch('Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css');
patch('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css');
patch('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css');
console.log("Patched cards 2");
