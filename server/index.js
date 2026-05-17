import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  prisma,
  getNewsStoriesDict,
  getJobOpeningsDict,
  safeStringify,
} from './data.js';
import {
  login as authLogin,
  logout as authLogout,
  whoami as authWhoami,
  requirePageAuth,
} from './auth.js';
import { adminRouter } from './admin.js';
import { uploadRouter, uploadErrorHandler, UPLOADS } from './upload.js';
import {
  renderHome,
  renderAdminHome,
  renderAdminEditIntro,
  renderAdminEditAbout,
  renderAdminEditTeam,
  renderAdminEditCareers,
  renderAdminEditNews,
  renderAdminEditContact,
  renderAdminJobEdit,
  renderAdminNewsEdit,
  renderAdminLogin,
  renderAllNews,
  renderNewsArticle,
  renderAllOpenings,
  renderJobPosting,
} from './render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cookieParser());

// ============== Public clean URLs (README §3.6) =====================
//
// req.path is NOT URL-decoded by Express. Most paths here are pure ASCII
// so plain string comparison works; for the legacy literal-filename
// aliases (with a space) we decode before comparing.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  let p;
  try { p = decodeURIComponent(req.path); } catch { return next(); }

  // Home aliases
  if (p === '/' || p === '/index.html' || p === '/Top Crop.html') {
    return renderHome(req, res, next);
  }
  // Public news/careers clean URLs
  if (p === '/news')                         return renderAllNews(req, res);
  if (p === '/careers')                      return renderAllOpenings(req, res);

  // Admin login (no auth)
  if (p === '/admin/login')                  return renderAdminLogin(req, res);

  next();
});

// Slug-style public routes
app.get('/news/:slug',     renderNewsArticle);
app.get('/careers/:slug',  renderJobPosting);

// ============== Auth API ============================================
app.post('/api/auth/login',  express.json(), (req, res) => authLogin(req, res, req.body));
app.post('/api/auth/logout', authLogout);
app.get ('/api/auth/whoami', authWhoami);

// ============== Admin pages (auth required) =========================
app.get('/admin',                   requirePageAuth, renderAdminHome);
app.get('/admin/intro',             requirePageAuth, renderAdminEditIntro);
app.get('/admin/about',             requirePageAuth, renderAdminEditAbout);
app.get('/admin/team',              requirePageAuth, renderAdminEditTeam);
app.get('/admin/careers',           requirePageAuth, renderAdminEditCareers);
app.get('/admin/news',              requirePageAuth, renderAdminEditNews);
app.get('/admin/contact',           requirePageAuth, renderAdminEditContact);
app.get('/admin/openings/new',      requirePageAuth, (req, res) => {
  req.params = { slug: 'new' };
  return renderAdminJobEdit(req, res);
});
app.get('/admin/openings/:slug',    requirePageAuth, renderAdminJobEdit);
app.get('/admin/news/new',          requirePageAuth, (req, res) => {
  req.params = { slug: 'new' };
  return renderAdminNewsEdit(req, res);
});
app.get('/admin/news/:slug',        requirePageAuth, renderAdminNewsEdit);

// ============== Admin API (auth required) ===========================
app.use('/api/admin', adminRouter);
app.use('/api/admin', uploadRouter);
app.use(uploadErrorHandler);

// Shared client helper script loaded by every admin page (injected by
// server/render.js right after window.__ADMIN__).
app.get('/admin-app.js', (_req, res) => {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'admin-app.js'));
});

// Shared mobile responsive stylesheet — server/render.js injects a <link>
// to this URL into every HTML response so the same overrides apply to the
// public site, news/career templates, and every admin page.
app.get('/mobile-styles.css', (_req, res) => {
  res.set('Content-Type', 'text/css; charset=utf-8');
  res.set('Cache-Control', IS_PROD ? 'public, max-age=86400' : 'no-store');
  res.sendFile(path.join(__dirname, 'mobile-styles.css'));
});

// ============== Legacy DB-backed data scripts =======================
//
// `<script src="news-data.js">` and `<script src="careers-data.js">`
// in unchanged HTML files now resolve to live DB content.
app.get('/news-data.js', async (_req, res, next) => {
  try {
    const dict = await getNewsStoriesDict();
    res.set('Content-Type', 'application/javascript; charset=utf-8');
    res.set('Cache-Control', 'no-store');
    res.send(`window.NEWS_STORIES = ${safeStringify(dict)};\n`);
  } catch (err) { next(err); }
});
app.get('/careers-data.js', async (_req, res, next) => {
  try {
    const dict = await getJobOpeningsDict();
    res.set('Content-Type', 'application/javascript; charset=utf-8');
    res.set('Cache-Control', 'no-store');
    res.send(`window.JOBS = ${safeStringify(dict)};\n`);
  } catch (err) { next(err); }
});

// ============== Health probe =========================================
app.get('/healthz', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'up' });
  } catch (err) {
    res.status(500).json({ ok: false, db: 'down', error: String(err) });
  }
});

// ============== Uploads (served from persistent storage) =============
//
// Mounted before the generic static handler so that when UPLOADS points at
// a volume outside the project root (Railway etc.) requests to /uploads/*
// resolve to the volume, not to the bundled prototype assets that ship
// with the code.
app.use('/uploads', express.static(UPLOADS, {
  maxAge: IS_PROD ? '1y' : 0,
  immutable: IS_PROD,
  fallthrough: true,
}));

// ============== Static prototype assets ==============================
//
// Static middleware is a fallback. Every URL the explicit routes above
// match never reaches static. The remaining traffic — /uploads/*,
// /src/*.jsx, fonts, the unchanged Admin Edit *.html files served via
// /admin/* clean URLs — gets served from disk.
//
// In dev we send `Cache-Control: no-store` for HTML and JSX so the
// browser never holds a stale prototype after source edits.
app.use(express.static(ROOT, {
  extensions: ['html'],
  setHeaders(res, filePath) {
    if (filePath.endsWith('.jsx')) {
      res.setHeader('Content-Type', 'text/babel; charset=utf-8');
    }
    if (!IS_PROD && /\.(html|jsx)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-store');
    }
  },
}));

// On a fresh deploy (e.g. first Railway boot against an empty volume)
// the migrations land but the tables are empty. Auto-seed once so the
// site is immediately functional. Existing data is never touched —
// the check is "if there's no AboutConfig row, do an initial seed".
async function bootstrapIfEmpty() {
  try {
    const present = await prisma.aboutConfig.findUnique({ where: { id: 1 } });
    if (present) return;
    console.log('Empty DB detected — running initial seed...');
    const { seedDb } = await import('../prisma/seed.js');
    await seedDb(prisma);
    console.log('Initial seed complete.');
  } catch (err) {
    // Tables not migrated yet would also throw here — fail loud so the
    // operator notices instead of silently running with no content.
    console.error('Bootstrap seed failed:', err);
  }
}

const server = app.listen(PORT, async () => {
  console.log(`Top Crop server running at http://localhost:${PORT}`);
  await bootstrapIfEmpty();
});

const shutdown = async () => {
  console.log('\nShutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);
