'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/api/admin/status', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.admin) {
      window.location.href = '/';
    }
  } catch (err) {
    console.error('Error checking admin status:', err);
  }
});

document.getElementById('admin-login-btn').addEventListener('click', async () => {
  const user = document.getElementById('admin-username').value.trim();
  const pass = document.getElementById('admin-password').value.trim();
  const errorEl = document.getElementById('admin-login-error');
  errorEl.textContent = '';

  try {
    const res = await fetch('/api/admin/login', { credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.token) localStorage.setItem('adminToken', json.token);
      document.getElementById('login-box').style.display = 'none';
      document.getElementById('change-password-box').style.display = 'block';
    } else {
      errorEl.textContent = 'Invalid credentials';
    }
  } catch (err) {
    errorEl.textContent = 'Error connecting to server';
  }
});

document.getElementById('admin-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    document.getElementById('admin-login-btn').click();
  }
});


document.getElementById('next-time-btn').addEventListener('click', () => {
  window.location.href = '/';
});

document.getElementById('save-password-btn').addEventListener('click', async () => {
  const newPwd = document.getElementById('new-password').value;
  const confirmPwd = document.getElementById('confirm-password').value;
  const errorEl = document.getElementById('change-password-error');
  errorEl.textContent = '';
  
  if (newPwd !== confirmPwd) {
    errorEl.textContent = 'Passwords do not match';
    return;
  }
  
  if (newPwd.length < 12) {
    errorEl.textContent = 'Password must be at least 12 characters';
    return;
  }
  if (!/[A-Z]/.test(newPwd)) {
    errorEl.textContent = 'Password must contain at least one capital letter';
    return;
  }
  if (!/[0-9]/.test(newPwd)) {
    errorEl.textContent = 'Password must contain at least one digit';
    return;
  }
  if (!/[^A-Za-z0-9]/.test(newPwd)) {
    errorEl.textContent = 'Password must contain at least one special character';
    return;
  }
  
  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ newPassword: newPwd })
    });
    
    if (res.ok) {
      alert('Password updated successfully');
      window.location.href = '/';
    } else {
      const json = await res.json();
      errorEl.textContent = json.error || 'Failed to update password';
    }
  } catch (err) {
    errorEl.textContent = 'Error connecting to server';
  }
});


document.getElementById('new-password').addEventListener('input', (e) => {
  const val = e.target.value;
  
  const rules = {
    length: val.length >= 12,
    special: /[^A-Za-z0-9]/.test(val),
    digit: /[0-9]/.test(val),
    capital: /[A-Z]/.test(val)
  };
  
  document.getElementById('rule-length').style.color = rules.length ? 'green' : 'var(--text-muted)';
  document.getElementById('rule-special').style.color = rules.special ? 'green' : 'var(--text-muted)';
  document.getElementById('rule-digit').style.color = rules.digit ? 'green' : 'var(--text-muted)';
  document.getElementById('rule-capital').style.color = rules.capital ? 'green' : 'var(--text-muted)';
});
