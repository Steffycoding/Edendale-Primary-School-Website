const fs = require('fs');

let readme = fs.readFileSync('Edendale-Primary-School-main/edendale/README.md', 'utf8');

const nodeInstructions = `
## How to Run on Node.js (Local/Express)
For rapid prototyping, this project includes a lightweight Node.js Express server that uses a JSON file as a database.

### Prerequisites
- Node.js (v18+)

### Steps
1. Navigate to the project root folder.
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the Express server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open your browser and go to \`http://localhost:3000\`.

> **Note:** The server will automatically create an \`edendale.json\` file to act as your database, pre-seeded with initial data and the default admin user.

---
`;

readme = readme.replace('## How to Run on Windows', nodeInstructions + '## How to Run on Windows');

fs.writeFileSync('Edendale-Primary-School-main/edendale/README.md', readme);
console.log("Updated README with Node.js instructions");
