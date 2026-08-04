const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');

js = js.replace('function saveAllChanges() {\n  if (Object.keys(pendingChanges).length === 0)', 'async function saveAllChanges() {\n  if (Object.keys(pendingChanges).length === 0)');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', js);
