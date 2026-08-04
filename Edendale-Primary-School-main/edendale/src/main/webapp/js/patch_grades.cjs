const fs = require('fs');
let html = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/pages/grades.html', 'utf8');

html = html.replace(
  /<a href="https:\/\/wcedonline.westerncape.gov.za\/admissions"\s*target="_blank"\s*rel="noopener noreferrer"\s*class="btn btn-primary">\s*Apply for Admissions\s*<\/a>/,
  '<a href="https://wcedonline.westerncape.gov.za/admissions" target="_blank" rel="noopener noreferrer" class="btn btn-primary" data-editable data-type="link" data-field="admissions_cta_link">Apply for Admissions</a>'
);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/pages/grades.html', html);
console.log("Patched grades HTML");
