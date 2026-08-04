const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', 'utf8');

css = css.replace(/left: calc\(50% \+ 130px\);\n  top: 50%;\n  transform: translate\(-50%, -50%\);/, 
`right: 60px;
  top: 50%;
  transform: translateY(-50%);`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', css);

let styleCss = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css', 'utf8');
styleCss = styleCss.replace(/\.nav-inner \{\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n\}/, 
`.nav-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}`);
fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css', styleCss);

console.log("Patched admin pos.");
