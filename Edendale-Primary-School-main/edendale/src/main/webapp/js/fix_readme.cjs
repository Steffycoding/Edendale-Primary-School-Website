const fs = require('fs');

let readme = fs.readFileSync('Edendale-Primary-School-main/edendale/README.md', 'utf8');

readme = readme.replace(/### How it works[\s\S]*?### What can be edited/, `### How it works
1. An **invisible gear icon** sits perfectly centered in the navigation bar. It is camouflaged with the same color as the banner to keep it hidden.
2. Clicking it opens the **Admin Login modal**.
3. After successful login, the page enters **edit mode**:
   - All editable elements are highlighted with a gold dashed border.
   - Clicking any element opens an **inline edit popup**.
   - Text fields show a textarea; image fields show a URL input.
4. A **bottom admin bar** appears with "Save All Changes" and "Logout" buttons.
5. Clicking **Save All Changes** sends all edits to the Java backend in one request.

### Default Login
\`\`\`
Username: admin
Password: edendale2024
\`\`\`
> ⚠ Note: The authentication is currently hardcoded in \`js/admin.js\` for demonstration purposes. Before production deployment, update \`handleLogin()\` to use the \`/api/admin/login\` endpoint and update the BCrypt hash in \`schema.sql\`.

### What can be edited`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/README.md', readme);
console.log("Fixed README");
