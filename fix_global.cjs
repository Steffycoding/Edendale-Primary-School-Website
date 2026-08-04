const fs = require('fs');
const path = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/  \.nav-links {\n    display: none;\n  }/g, '');

fs.writeFileSync(path, css);
console.log("Fixed global.css");
