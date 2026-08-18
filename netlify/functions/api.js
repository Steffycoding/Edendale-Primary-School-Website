export async function handler(event, context) {
  // Extract the actual API path from the request
  // Netlify redirects /api/* to /.netlify/functions/api, so we need to reconstruct the original path
  const originalPath = event.rawPath || event.path;
  const method = event.httpMethod;
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Request:', method);
    console.log('Path:', event.path);
    console.log('Raw path:', event.rawPath);
    console.log('Original path:', originalPath);
    console.log('Query params:', event.queryStringParameters);
    
    // Test endpoint - respond to any request to verify function is working
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        message: 'Netlify function is working!',
        path: event.path,
        rawPath: event.rawPath,
        originalPath: originalPath,
        method: method,
        query: event.queryStringParameters
      }) 
    };

  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message, stack: error.stack }) };
  }
}
