const fs = require('fs');
let css = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css', 'utf8');

// Replace the old nav-links block
css = css.replace(/\.nav-links \{\n  display: flex;\n  gap: 28px;\n  list-style: none;\n\}/g,
`.nav-links {
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  right: -300px;
  width: 280px;
  height: 100vh;
  background: var(--white);
  padding: 100px 20px 20px 20px;
  box-shadow: -4px 0 15px rgba(0,0,0,0.1);
  z-index: 1000;
  transition: right 0.3s ease;
  overflow-y: auto;
  list-style: none;
  gap: 0;
}
.nav-links.show {
  right: 0;
}`);

css = css.replace(/\.nav-links a \{\n  color: white;\n  font-size: 0\.95rem;\n\}/g,
`.nav-links a {
  display: block;
  color: var(--text-dark) !important;
  font-size: 1.1rem;
  padding: 12px 0;
  border-bottom: 1px solid #eaeaea;
  width: 100%;
}`);

css = css.replace(/\.nav-links a\.active,\n\.nav-links a:hover \{\n  color: var\(--gold\);\n\}/g,
`.nav-links a.active,
.nav-links a:hover {
  color: var(--primary);
}`);

// Remove the mobile-menu-btn initial definition
css = css.replace(/\.mobile-menu-btn \{\n  display: none;\n  background: none;\n  border: none;\n  color: white;\n  cursor: pointer;\n\}/g,
`.mobile-menu-btn {
  position: static;
  transform: none;
  margin: 0;
  background: var(--navy);
  border: 1px solid var(--gold);
  padding: 6px;
  border-radius: 4px;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
}
.nav-links.show + .mobile-menu-btn {
  color: var(--navy);
  background: transparent;
  border-color: transparent;
  position: fixed;
  top: 20px;
  right: 20px;
}`);

// Delete the mobile media queries for nav
css = css.replace(/@media \(max-width: 768px\) \{\n  \.mobile-menu-btn \{[\s\S]*?\}\n\}/, '');
css = css.replace(/@media \(max-width: 768px\) \{\n  \.mobile-menu-overlay \{[\s\S]*?\}\n\}/, '');

// Redefine overlay globally
css = css.replace(/\.mobile-menu-overlay \{\n  display: none;\n\}/,
`.mobile-menu-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.mobile-menu-overlay.show {
  display: block;
  opacity: 1;
  pointer-events: auto;
}`);


fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/css/style.css', css);
console.log("Patched style nav globally.");
