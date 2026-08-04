const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', 'utf8');

css = css.replace(/left: calc\(50% \+ 60px\);/, 'left: calc(50% + 130px);');

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', css);
console.log("Moved cog 70 more pixels to the right");
