const fs = require('fs');

let readme = fs.readFileSync('Edendale-Primary-School-main/edendale/README.md', 'utf8');

readme = readme.replace(/- ✅ Project ready for deployment/, `- ✅ Updated Admin Panel styling and login mechanics\n- ✅ Admin button integrated invisibly into the top navigation bar\n- ✅ Project ready for deployment`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/README.md', readme);
console.log("Fixed README updates section");
