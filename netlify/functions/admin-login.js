import { loadDb } from './db-utils.js';
import bcrypt from 'bcryptjs';

// Simple in-memory token storage (Note: This won't persist across function invocations in production)
// For production, you should use a proper database or Netlify's KV store
const adminTokens = new Set();

export async function handler(event, context) {
  // Only allow POST requests
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
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      adminTokens.add(token);
      
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
