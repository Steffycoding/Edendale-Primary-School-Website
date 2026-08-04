const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', 'utf8');

css = css.replace(/left: calc\(50% \+ 40px\);/, 'left: calc(50% + 60px);');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', css);
console.log("Moved cog slightly more to the right");
