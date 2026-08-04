const fs = require('fs');
let js = fs.readFileSync('db-json.js', 'utf8');

js = js.replace(/const hash1 = await bcrypt\.hash\('Admin@1234', 10\);/, "const hash1 = await bcrypt.hash('edendale2024', 10);");

fs.writeFileSync('db-json.js', js);
console.log("Fixed db-json.js");
