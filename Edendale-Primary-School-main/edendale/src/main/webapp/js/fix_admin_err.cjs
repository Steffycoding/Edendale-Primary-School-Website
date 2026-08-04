const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');

js = js.replace(/if \(adminPasswordEl\) \{[\s\S]*?\}\);[\s\S]*?\}/g, '');
js = js.replace(/\/\/ Allow Enter key in password field\n/g, '');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', js);
console.log("Fixed admin js error");
