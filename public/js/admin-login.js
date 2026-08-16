'use strict';

// Removed automatic redirect to prevent issues when refreshing during password change

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
      
      // Check if there's a redirect URL stored - if so, skip password change and redirect
      const redirectUrl = sessionStorage.getItem('adminRedirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('adminRedirectUrl');
        window.location.href = redirectUrl;
      } else {
        document.getElementById('login-box').style.display = 'none';
        document.getElementById('change-password-box').style.display = 'block';
      }
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

// Show password toggle functionality
document.getElementById('show-password').addEventListener('change', function() {
  const passwordInput = document.getElementById('admin-password');
  if (this.checked) {
    passwordInput.type = 'text';
  } else {
    passwordInput.type = 'password';
  }
});

// Show confirm password toggle functionality
document.getElementById('show-confirm-password').addEventListener('change', function() {
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  if (this.checked) {
    newPasswordInput.type = 'text';
    confirmPasswordInput.type = 'text';
  } else {
    newPasswordInput.type = 'password';
    confirmPasswordInput.type = 'password';
  }
});


document.getElementById('next-time-btn').addEventListener('click', () => {
  const redirectUrl = sessionStorage.getItem('adminRedirectUrl');
  if (redirectUrl) {
    sessionStorage.removeItem('adminRedirectUrl');
    window.location.href = redirectUrl;
  } else {
    window.location.href = '/';
  }
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
  
  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ newPassword: newPwd })
    });
    
    if (res.ok) {
      alert('Password updated successfully');
      const redirectUrl = sessionStorage.getItem('adminRedirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('adminRedirectUrl');
        window.location.href = redirectUrl;
      } else {
        window.location.href = '/';
      }
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
    digit: /[0-9]/.test(val),
    capital: /[A-Z]/.test(val)
  };
  
  document.getElementById('rule-length').style.color = rules.length ? 'green' : 'var(--text-muted)';
  document.getElementById('rule-digit').style.color = rules.digit ? 'green' : 'var(--text-muted)';
  document.getElementById('rule-capital').style.color = rules.capital ? 'green' : 'var(--text-muted)';
});
