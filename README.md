# Edendale Primary School Website

## Architecture Overview

This is a full-stack web application built using **Node.js, Express, and Vanilla JavaScript/HTML/CSS**. The system handles static content serving as well as an authenticated admin editing mode, enabling easy on-page content updates.

### Frontend
- **Static Pages:** Pure HTML/CSS pages located in the `public/` and `public/pages/` directories.
- **Styling:** Vanilla CSS in `public/css/main.css`, implementing a responsive, mobile-first design.
- **Scripts:** 
  - `public/js/main.js`: Handles dynamic content loading from the API for rendering text/images into the HTML.
  - `public/js/admin.js`: Manages the inline edit mode functionality when an admin is authenticated.
  - `public/js/admin-login.js`: Handles the login logic on the `/admin-login.html` page.

### Backend & Database
- **Server:** Node.js Express server (`server.js`).
- **Database:** A lightweight JSON-based data store (`edendale.json`), managed by `db-json.js`.
- **Authentication:** Sessions are managed using `express-session`, and passwords are cryptographically hashed via `bcryptjs`.
- **API Routes:**
  - `/api/content` (GET, PATCH): Fetches and updates editable content fields for different pages.
  - `/api/admin/login` (POST): Validates admin credentials and establishes a session.
  - `/api/admin/logout` (POST): Destroys the current admin session.
  - `/api/admin/status` (GET): Returns whether the current session is authenticated as an admin.

## Running the Application

### Development
\`\`\`bash
npm run dev
\`\`\`
The server will start on port 3000.

### Production
\`\`\`bash
npm start
\`\`\`

## Admin System Workflow
1. The admin user clicks the hidden **cog icon** in the top-right corner, or navigates to `/admin-login.html`.
2. The user enters their credentials. Upon success, an Express session is established.
3. The user is redirected back to the site, where `admin.js` detects the session via `/api/admin/status`.
4. Elements with the `data-editable` attribute receive a gold outline. Clicking them opens the inline edit popup.
5. Edits are accumulated and saved back to the server via the "Save All Changes" action in the floating admin bar.
