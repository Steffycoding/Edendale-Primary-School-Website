const fs = require('fs');
const glob = require('glob');

const files = glob.sync('Edendale-Primary-School-main/edendale/src/main/webapp/**/*.html');

files.forEach(file => {
  let html = fs.readFileSync(file, 'utf8');
  
  // Make sure global.css is first, then style.css, then admin.css
  // Wait, let's just make sure both are there.
  
  if (file.includes('index.html')) {
     html = html.replace(/<link rel="stylesheet" href="css\/style.css">\s*<link rel="stylesheet" href="css\/global.css">/, '<link rel="stylesheet" href="css/global.css">\n  <link rel="stylesheet" href="css/style.css">');
  } else {
     if (!html.includes('style.css')) {
       html = html.replace(/<link rel="stylesheet" href="\.\.\/css\/global\.css">/, '<link rel="stylesheet" href="../css/global.css">\n  <link rel="stylesheet" href="../css/style.css">');
     }
  }
  
  fs.writeFileSync(file, html);
});
console.log("Fixed css includes");
