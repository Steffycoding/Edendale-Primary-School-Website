const fs = require('fs');

let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css', 'utf8');

css = css.replace(/right: -300px;\n    width: 280px;\n    height: 100vh;\n    background: linear-gradient\(135deg, #ffffff 0%, #bbdefb 60%, #64b5f6 100%\) !important;/, 
`right: -300px;
    width: 280px;
    height: 100vh;
    background: var(--white);`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css', css);

let globalCss = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css', 'utf8');
globalCss = globalCss.replace(/background: linear-gradient\(135deg, #ffffff 0%, #bbdefb 60%, #64b5f6 100%\) !important;/g, 'background: linear-gradient(135deg, #ffffff 0%, #bbdefb 60%, #64b5f6 100%);');
fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/global.css', globalCss);

let adminCss = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', 'utf8');
adminCss = adminCss.replace(/background: linear-gradient\(135deg, #ffffff 0%, #bbdefb 60%, #64b5f6 100%\) !important;/g, 'background: var(--white);');
fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/admin.css', adminCss);

console.log("Fixed backgrounds.");
