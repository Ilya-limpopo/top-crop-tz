// Single-account session auth — argon2 password verification, signed
// httpOnly cookie, sliding 24h idle timeout.
//
// Sessions live in-memory (no DB table) — fine for a single-account admin
// console. Restarting the server invalidates everything, which is what
// we want for the dev workflow.

import argon2 from 'argon2';
import crypto from 'node:crypto';

const SESSION_COOKIE = 'topcrop_session';
const IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24h sliding

const sessions = new Map(); // sid -> { email, createdAt, lastSeen }

function signed(value, secret) {
  const sig = crypto.createHmac('sha256', secret).update(value).digest('hex');
  return `${value}.${sig}`;
}
function verifySigned(token, secret) {
  if (!token || token.indexOf('.') < 0) return null;
  const lastDot = token.lastIndexOf('.');
  const value = token.slice(0, lastDot);
  const sig   = token.slice(lastDot + 1);
  const want  = crypto.createHmac('sha256', secret).update(value).digest('hex');
  // Constant-time compare to thwart timing attacks.
  if (sig.length !== want.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  return value;
}

function newSid() { return crypto.randomBytes(32).toString('hex'); }

function getCfg() {
  const email   = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const hash    = process.env.ADMIN_PASSWORD_HASH || '';
  const secret  = process.env.SESSION_SECRET || 'dev-only-secret-change-me';
  return { email, hash, secret };
}

export async function login(req, res, body) {
  const { email, hash, secret } = getCfg();
  const reqEmail    = String(body?.email    ?? body?.login    ?? '').trim().toLowerCase();
  const reqPassword = String(body?.password ?? '');

  if (!reqEmail || !reqPassword) {
    return res.status(400).json({ ok: false, error: 'missing_credentials' });
  }
  if (!email || !hash) {
    return res.status(500).json({ ok: false, error: 'admin_not_configured', hint:
      'Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH in .env. Generate hash with `npm run admin:hash <password>`.' });
  }
  if (reqEmail !== email) {
    return res.status(401).json({ ok: false, error: 'invalid_credentials' });
  }
  let valid = false;
  try { valid = await argon2.verify(hash, reqPassword); } catch { valid = false; }
  if (!valid) {
    return res.status(401).json({ ok: false, error: 'invalid_credentials' });
  }

  const sid = newSid();
  sessions.set(sid, { email, createdAt: Date.now(), lastSeen: Date.now() });
  const token = signed(sid, secret);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: IDLE_TIMEOUT_MS,
    path: '/',
  });
  return res.json({ ok: true, email });
}

export function logout(req, res) {
  const { secret } = getCfg();
  const token = req.cookies?.[SESSION_COOKIE];
  const sid   = token ? verifySigned(token, secret) : null;
  if (sid) sessions.delete(sid);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  return res.json({ ok: true });
}

// Reads cookie, validates, returns session or null. Sliding-refreshes on
// every successful read so 24h timer counts from last activity.
export function readSession(req, res) {
  const { secret } = getCfg();
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const sid = verifySigned(token, secret);
  if (!sid) return null;
  const sess = sessions.get(sid);
  if (!sess) return null;
  if (Date.now() - sess.lastSeen > IDLE_TIMEOUT_MS) {
    sessions.delete(sid);
    return null;
  }
  sess.lastSeen = Date.now();
  // Refresh cookie expiry on activity.
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: IDLE_TIMEOUT_MS,
    path: '/',
  });
  return sess;
}

// Express middleware factories.
export function requireApiAuth(req, res, next) {
  const sess = readSession(req, res);
  if (!sess) return res.status(401).json({ ok: false, error: 'unauthorized' });
  req.session = sess;
  next();
}
export function requirePageAuth(req, res, next) {
  const sess = readSession(req, res);
  if (!sess) {
    // Send the user back to login with a `next` hint so we can return them.
    const next = encodeURIComponent(req.originalUrl);
    return res.redirect(`/admin/login?next=${next}`);
  }
  req.session = sess;
  next();
}
export function whoami(req, res) {
  const sess = readSession(req, res);
  return res.json({ ok: !!sess, email: sess?.email || null });
}
