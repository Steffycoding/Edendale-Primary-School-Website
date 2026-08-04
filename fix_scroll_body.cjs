const fs = require('fs');
const path = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(path, 'utf8');

css = css.replace(/body\.no-scroll {\n  overflow: hidden;\n  height: 100vh;\n}/g, 'body.no-scroll {\n  overflow: hidden;\n}');

fs.writeFileSync(path, css);
console.log("Fixed body scroll CSS");
