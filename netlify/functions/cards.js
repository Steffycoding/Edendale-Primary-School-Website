import { loadDb, saveDb } from './db-utils.js';

const VALID_SECTIONS = new Set(['extracurricular', 'cocurricular', 'activities', 'gallery']);
const MAX_TITLE_LENGTH = 200;
const MAX_ICON_LENGTH = 16;
const MAX_IMAGE_URL_LENGTH = 255;

// Simple in-memory token storage (shared with admin-login)
const adminTokens = new Set();

function validateCard(card) {
  if (card.title.length > MAX_TITLE_LENGTH) {
    return `Title must be ${MAX_TITLE_LENGTH} characters or fewer.`;
  }
  if (card.icon && card.icon.length > MAX_ICON_LENGTH) {
    return `Icon must be ${MAX_ICON_LENGTH} characters or fewer.`;
  }
  if (card.imageUrl && card.imageUrl.length > MAX_IMAGE_URL_LENGTH) {
    return `Image URL must be ${MAX_IMAGE_URL_LENGTH} characters or fewer.`;
  }
  if (card.section === 'gallery' && !card.imageUrl) {
    return 'Gallery items need an image.';
  }
  return null;
}

function cardString(body, key) {
  const value = body[key];
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function emptyToNull(value) {
  return value === '' ? null : value;
}

function duplicateTitleExists(db, card, ignoreId) {
  return db.cards.some(c =>
    c.id !== ignoreId &&
    c.page === card.page &&
    c.section === card.section &&
    c.title.toLowerCase() === card.title.toLowerCase()
  );
}

function checkAuth(event) {
  const auth = event.headers.authorization;
  const cookie = event.headers.cookie || '';
  const tokenMatch = cookie.match(/admin_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;
  
  return auth || adminTokens.has(token);
}

export async function handler(event, context) {
  const method = event.httpMethod;
  
  // GET - fetch cards
  if (method === 'GET') {
    try {
      const db = await loadDb(context);
      const { page, section } = event.queryStringParameters;
      
      if (!page) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing 'page' query parameter." })
        };
      }

      let cards = db.cards.filter(c => c.page === String(page).trim().toLowerCase());
      if (section) {
        cards = cards.filter(c => c.section === String(section).trim().toLowerCase());
      }
      cards.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cards)
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  // POST - create card (admin only)
  if (method === 'POST') {
    if (!(await checkAuth(event, context))) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorised.' })
      };
    }
    
    try {
      const db = await loadDb(context);
      const body = JSON.parse(event.body);
      const page = cardString(body, 'page').toLowerCase();
      const section = cardString(body, 'section').toLowerCase();
      const title = cardString(body, 'title');

      if (!page || !section || !title) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'page, section and title are required.' })
        };
      }
      if (!VALID_SECTIONS.has(section)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Unknown section '${section}'.` })
        };
      }

      const card = {
        id: db.cards.length > 0 ? Math.max(...db.cards.map(c => c.id)) + 1 : 1,
        page,
        section,
        icon: emptyToNull(cardString(body, 'icon')),
        title,
        body: emptyToNull(cardString(body, 'body')),
        imageUrl: emptyToNull(cardString(body, 'imageUrl')),
        sortOrder: db.cards.filter(c => c.page === page && c.section === section).length + 1
      };

      const invalid = validateCard(card);
      if (invalid) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: invalid })
        };
      }

      if (duplicateTitleExists(db, card, null)) {
        return {
          statusCode: 409,
          body: JSON.stringify({
            error: `A card titled "${card.title}" already exists in this section.`
          })
        };
      }

      db.cards.push(card);
      await saveDb(context);

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  // PUT - update card (admin only)
  if (method === 'PUT') {
    if (!checkAuth(event)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorised.' })
      };
    }
    
    try {
      const db = await loadDb(context);
      const id = parseInt(event.path.split('/').pop(), 10);
      if (Number.isNaN(id)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing card ID in path.' })
        };
      }

      const existing = db.cards.find(c => c.id === id);
      if (!existing) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Card not found.' })
        };
      }

      const body = JSON.parse(event.body);
      const updated = { ...existing };
      
      if ('title' in body) updated.title = cardString(body, 'title');
      if ('icon' in body) updated.icon = emptyToNull(cardString(body, 'icon'));
      if ('body' in body) updated.body = emptyToNull(cardString(body, 'body'));
      if ('imageUrl' in body) updated.imageUrl = emptyToNull(cardString(body, 'imageUrl'));
      if ('sortOrder' in body) {
        const order = Number(body.sortOrder);
        if (!Number.isFinite(order)) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'sortOrder must be a number.' })
          };
        }
        updated.sortOrder = order;
      }

      if (!updated.title) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'title cannot be empty.' })
        };
      }

      const invalid = validateCard(updated);
      if (invalid) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: invalid })
        };
      }

      if (duplicateTitleExists(db, updated, id)) {
        return {
          statusCode: 409,
          body: JSON.stringify({
            error: 'Another card in this section already uses that title.'
          })
        };
      }

      Object.assign(existing, updated);
      await saveDb(context);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existing)
      };
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
  }
  
  // DELETE - delete card (admin only)
  if (method === 'DELETE') {
    if (!checkAuth(event)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorised.' })
      };
    }
    
    try {
      const db = await loadDb(context);
      const id = parseInt(event.path.split('/').pop(), 10);
      if (Number.isNaN(id)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing card ID in path.' })
        };
      }

      const index = db.cards.findIndex(c => c.id === id);
      if (index === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Card not found.' })
        };
      }

      db.cards.splice(index, 1);
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
