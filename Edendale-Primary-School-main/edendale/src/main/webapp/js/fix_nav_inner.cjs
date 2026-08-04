const fs = require('fs');
let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css', 'utf8');

css = css.replace('.nav-inner {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}',
`.nav-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css', css);
console.log("Fixed nav-inner css");
