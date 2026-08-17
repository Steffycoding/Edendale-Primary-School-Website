import { loadDb, saveDb } from './db-utils.js';
import bcrypt from 'bcryptjs';

// Simple in-memory token storage (shared with admin-login)
const adminTokens = new Set();

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const auth = event.headers.authorization;
  const cookie = event.headers.cookie || '';
  const tokenMatch = cookie.match(/admin_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  // Simple token check
  if (!auth && !adminTokens.has(token)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    const { newPassword } = JSON.parse(event.body);
    if (!newPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password required' })
      };
    }
    if (newPassword.length < 12) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password must be at least 12 characters' })
      };
    }
    if (!/[A-Z]/.test(newPassword)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password must contain at least one capital letter' })
      };
    }
    if (!/[0-9]/.test(newPassword)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password must contain at least one digit' })
      };
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password must contain at least one special character' })
      };
    }

    const db = await loadDb(context);
    if (db.admin_users.length > 0) {
      const isSame = await bcrypt.compare(newPassword, db.admin_users[0].password_hash);
      if (isSame) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'New password must be different from the existing password' })
        };
      }

      const hash = await bcrypt.hash(newPassword, 10);
      db.admin_users.forEach(u => u.password_hash = hash);
      await saveDb(context);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}
