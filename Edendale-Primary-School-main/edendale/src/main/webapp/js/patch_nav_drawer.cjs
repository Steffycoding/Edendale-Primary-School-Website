const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css', 'utf8');

css = css.replace(/background-color: white;/g,
`background: linear-gradient(135deg, var(--white) 0%, #e6f0fa 100%);`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css', css);
console.log("Patched nav drawer");
