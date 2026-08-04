const fs = require('fs');
const glob = require('glob');

const cssFiles = glob.sync('Edendale-Primary-School-main/edendale/src/main/webapp/css/*.css');

cssFiles.forEach(file => {
  let css = fs.readFileSync(file, 'utf8');
  
  // Replace the previous subtle gradients with a much stronger, undeniable blue gradient
  css = css.replace(/background:\s*linear-gradient\([^)]+\)\s*(?:!important)?;/g, 
    'background: linear-gradient(135deg, #ffffff 0%, #bbdefb 60%, #64b5f6 100%) !important;');
  
  // Also check if any are still set to white and need the gradient
  css = css.replace(/background-color:\s*white;/g, 
    'background: linear-gradient(135deg, #ffffff 0%, #bbdefb 60%, #64b5f6 100%) !important;');
    
  fs.writeFileSync(file, css);
});

console.log("Made blue gradients much stronger.");
