const fs = require('fs');
const glob = require('glob');

const files = glob.sync('Edendale-Primary-School-main/edendale/src/main/webapp/**/*.html');

files.forEach(file => {
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<link rel="stylesheet" href="\.\.\/css\/admin\.css">\n\s*<link rel="stylesheet" href="\.\.\/css\/admin\.css">/g, '<link rel="stylesheet" href="../css/admin.css">');
  fs.writeFileSync(file, html);
});
