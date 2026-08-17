import { loadDb } from './db-utils.js';
import { createToken } from './auth-utils.js';
import bcrypt from 'bcryptjs';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    const db = await loadDb();
    const user = db.admin_users.find(u => u.username === username);

    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = createToken(user.username);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `admin_token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=86400`
        },
        body: JSON.stringify({ success: true, token })
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid credentials' })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}