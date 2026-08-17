// netlify/functions/api.js
//
// Wraps the existing Express app (server.js) so it can run as a single
// Netlify Function, instead of splitting every route into its own file.
// netlify.toml redirects all /api/* requests here.

import serverless from 'serverless-http';
import app from '../../server.js';

export const handler = serverless(app);