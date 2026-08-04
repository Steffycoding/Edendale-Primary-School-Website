const fs = require('fs');
let readme = fs.readFileSync('Edendale-Primary-School-main/edendale/README.md', 'utf8');

readme = readme.replace(
  /> ⚠ Note: The authentication is currently hardcoded in `js\/admin.js` for demonstration purposes. Before production deployment, update `handleLogin\(\)` to use the `\/api\/admin\/login` endpoint and update the BCrypt hash in `schema.sql`./,
  "> ⚠ Note: Change the default password immediately after first deployment. For the Java backend, update the BCrypt hash in `schema.sql`. For the Node.js backend, update the hash in `db-json.js`."
);

fs.writeFileSync('Edendale-Primary-School-main/edendale/README.md', readme);
console.log("Fixed auth note in README");
