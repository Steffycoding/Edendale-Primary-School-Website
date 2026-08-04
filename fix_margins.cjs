const fs = require('fs');

let html = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/pages/about.html', 'utf8');

html = html.replace(/margin:0 16px;/g, 'margin:12px 16px;');
html = html.replace(/margin:0 12px;/g, 'margin:12px 12px;');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/pages/about.html', html);
console.log("Fixed inline margins in about.html");
