import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────
// Stateless, signed admin tokens.
//
// The old code stored issued tokens in an in-memory `Set` inside each
// function file. Two bugs came from that:
//
//  1. Each function file (admin-login.js, cards.js, events.js, ...) is
//     bundled and run as its OWN process by Netlify. They never shared
//     that Set, so a token minted by admin-login.js was never actually
//     recognised by cards.js/events.js/content.js — it only "worked"
//     when checkAuth() fell through to its other branch:
//
//  2. `checkAuth()` did `const auth = event.headers.authorization;
//     return auth || adminTokens.has(token);` — that returns true the
//     moment ANY Authorization header is present, valid or not. That's
//     effectively no auth check at all.
//
// This module replaces both with a signed, self-verifying token (HMAC),
// so any function can verify a token on its own — no shared storage
// needed, and a forged/missing token is correctly rejected.
//
// IMPORTANT: set ADMIN_TOKEN_SECRET as an environment variable in your
// Netlify site settings (Site configuration → Environment variables).
// If it's not set, a fallback is used so things don't crash, but ANYONE
// could forge a valid token — do not run production like that.
// ─────────────────────────────────────────────────────────────

const SECRET = process.env.ADMIN_TOKEN_SECRET || 'dev-only-fallback-secret-change-me';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

/** Mint a token for a username, valid for TOKEN_TTL_MS. */
export function createToken(username) {
  const expiry = Date.now() + TOKEN_TTL_MS;
  const payload = `${username}.${expiry}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

/** Returns true only if the token was minted by us and hasn't expired. */
export function verifyToken(token) {
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [username, expiry, signature] = decoded.split('.');
    if (!username || !expiry || !signature) return false;

    const expected = sign(`${username}.${expiry}`);
    if (signature !== expected) return false;
    if (Date.now() > Number(expiry)) return false;

    return true;
  } catch {
    return false;
  }
}

/** Pulls a token out of either the Authorization header or the cookie. */
export function extractToken(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  const cookie = event.headers.cookie || '';
  const match = cookie.match(/admin_token=([^;]+)/);
  return match ? match[1] : null;
}

/** Drop-in replacement for the old per-file checkAuth(event). */
export function checkAuth(event) {
  return verifyToken(extractToken(event));
}