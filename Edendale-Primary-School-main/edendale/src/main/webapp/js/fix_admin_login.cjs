const fs = require('fs');
let js = fs.readFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', 'utf8');

js = js.replace(/if \(user === 'admin' && pass === 'edendale2024'\) \{[\s\S]*?\} else \{[\s\S]*?\}/, `
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    
    if (res.ok) {
      isAdminMode = true;
      document.body.classList.add('admin-mode');
      if (adminBar) adminBar.classList.add('active');
      hideLoginModal();
      adminUsernameEl.value = '';
      adminPasswordEl.value = '';
      alert('Logged in as Admin. You can now edit content.');
    } else {
      if (adminLoginError) adminLoginError.textContent = 'Invalid credentials';
    }
  } catch (err) {
    if (adminLoginError) adminLoginError.textContent = 'Error connecting to server';
  }
`);

fs.writeFileSync('Edendale-Primary-School-main/edendale/src/main/webapp/js/admin.js', js);
console.log("Fixed admin js login");
