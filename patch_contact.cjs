const fs = require('fs');

let html = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/pages/contact.html', 'utf8');

html = html.replace(/<!-- Government Support -->[\s\S]*?<!-- Interested in Supporting -->/, '<!-- Interested in Supporting -->');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/pages/contact.html', html);
console.log("Patched contact.html");
