const fs = require('fs');

const cssPath = 'Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

if (!css.includes('body.no-scroll')) {
  css += `
body.no-scroll {
  overflow: hidden;
  height: 100vh;
}
`;
  fs.writeFileSync(cssPath, css);
}
console.log("Fixed CSS scroll");
