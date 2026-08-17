import { loadDb, saveDb } from './db-utils.js';

// Simple in-memory token storage (shared with admin-login)
const adminTokens = new Set();

export async function handler(event, context) {
  const method = event.httpMethod;
  
  // GET - fetch content for a page
  if (method === 'GET') {
    try {
      const page = event.queryStringParameters.page;
      if (!page) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Page required' })
        };
      }
      
      const db = await loadDb(context);
      const pageContent = db.content.filter(c => c.page === page);
      const contentMap = {};
      pageContent.forEach(c => {
        if (c.field_name === 'card_structure') {
          contentMap[c.field_name] = JSON.parse(c.value);
        } else {
          contentMap[c.field_name] = c.value;
        }
      });
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentMap)
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  // PATCH - update content (admin only)
  if (method === 'PATCH') {
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
      const { page, changes, cardData } = JSON.parse(event.body);
      if (!page) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid payload' })
        };
      }
      
      const db = await loadDb(context);
      
      // Handle individual field changes
      if (changes) {
        for (const [field_name, value] of Object.entries(changes)) {
          const existing = db.content.find(c => c.page === page && c.field_name === field_name);
          if (existing) {
            existing.value = value;
          } else {
            db.content.push({
              id: db.content.length > 0 ? Math.max(...db.content.map(c => c.id)) + 1 : 1,
              page,
              field_name,
              value,
              type: 'text'
            });
          }
        }
      }
      
      // Handle card data for about page and home page
      if (cardData && (page === 'about' || page === 'home')) {
        const cardField = db.content.find(c => c.page === page && c.field_name === 'card_structure');
        if (cardField) {
          cardField.value = JSON.stringify(cardData);
        } else {
          db.content.push({
            id: db.content.length > 0 ? Math.max(...db.content.map(c => c.id)) + 1 : 1,
            page,
            field_name: 'card_structure',
            value: JSON.stringify(cardData),
            type: 'json'
          });
        }
      }
      
      await saveDb(context);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}
