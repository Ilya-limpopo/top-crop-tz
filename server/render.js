// Page renderers — read prototype HTML files at request time and inject
// per-page bootstrap data as `<script>window.__ADMIN__ = {...}</script>`
// (admin) or `window.TOPCROP = {...}` (home).
//
// HTML markup is never modified — only a single <script> tag is added.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  prisma,
  getSitePayload,
  safeStringify,
} from './data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

// Inject a script tag right before </body>. Works for any HTML page.
function injectBeforeBody(html, scriptTag) {
  if (html.includes('</body>')) return html.replace('</body>', `${scriptTag}\n</body>`);
  return html + scriptTag;
}

// Inject inside <head> as the very first child. Used for clean-URL pages
// that need to set up a fake `?id=<slug>` query string BEFORE the page's
// own bottom-of-body script reads location.search.
function injectIntoHead(html, scriptTag) {
  if (html.includes('<head>')) return html.replace('<head>', `<head>\n${scriptTag}`);
  return scriptTag + html;
}

// One-line responsive overrides — loaded from /mobile-styles.css. Inserted
// into every rendered page; the static prototype HTML files also reference
// this file directly so it loads even when bypassing the render layer.
const MOBILE_LINK = '<link rel="stylesheet" href="/mobile-styles.css">';
function injectMobileLink(html) {
  if (html.includes(MOBILE_LINK)) return html;
  if (html.includes('</head>')) return html.replace('</head>', `  ${MOBILE_LINK}\n</head>`);
  return injectIntoHead(html, MOBILE_LINK);
}

function renderHtml(res, html) {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send(injectMobileLink(html));
}

function readFile(name) {
  return readFileSync(path.join(ROOT, name), 'utf8');
}

// ---------- HOME (/, /Top Crop.html) -----------------------------------
export async function renderHome(_req, res) {
  const html    = readFile('Top Crop.html');
  const payload = await getSitePayload();
  const tag =
    `<script id="topcrop-payload">window.TOPCROP = ${safeStringify(payload)};</script>\n` +
    `<script src="/news-data.js"></script>\n` +
    `<script src="/careers-data.js"></script>\n`;
  // Insert before the JSX scripts so they evaluate with payload available.
  const marker = '<script type="text/babel" src="src/intro.jsx">';
  const out = html.includes(marker)
    ? html.replace(marker, tag + '  ' + marker)
    : injectBeforeBody(html, tag);
  renderHtml(res, out);
}

// ---------- ADMIN page renderers ---------------------------------------
//
// Each admin page gets a single payload shape that the page's inline
// script reads via window.__ADMIN__. The shape is per-page so each form
// gets exactly the data it needs.

function adminInject(html, payload, sessionEmail) {
  const tag = `<script id="admin-payload">window.__ADMIN__ = ${safeStringify({
    session: { email: sessionEmail },
    ...payload,
  })};</script>\n<script src="/admin-app.js"></script>\n`;
  return injectIntoHead(html, tag);
}

const parseJson = (s, fb = null) => { try { return JSON.parse(s); } catch { return fb; } };

export async function renderAdminHome(req, res) {
  const html = readFile('Admin Home.html');
  const [news, jobs] = await Promise.all([
    prisma.newsStory.count(),
    prisma.jobOpening.count(),
  ]);
  renderHtml(res, adminInject(html, { resource: 'home', counts: { news, jobs } }, req.session.email));
}

export async function renderAdminEditIntro(req, res) {
  const html = readFile('Admin Edit Intro.html');
  const r = await prisma.introConfig.findUnique({ where: { id: 1 } });
  renderHtml(res, adminInject(html, {
    resource: 'intro',
    data: { videoUrl: r?.videoUrl ?? '', captions: parseJson(r?.captions, []) },
  }, req.session.email));
}

export async function renderAdminEditAbout(req, res) {
  const html = readFile('Admin Edit About.html');
  const r = await prisma.aboutConfig.findUnique({ where: { id: 1 } });
  renderHtml(res, adminInject(html, {
    resource: 'about',
    data: {
      eyebrow: r?.eyebrow ?? '', title: r?.title ?? '', subtitle: r?.subtitle ?? '',
      body: r?.body ?? '',
      photos: parseJson(r?.photos, []),
      facts:  parseJson(r?.facts,  []),
    },
  }, req.session.email));
}

export async function renderAdminEditTeam(req, res) {
  const html = readFile('Admin Edit Team.html');
  const [r, members] = await Promise.all([
    prisma.teamConfig.findUnique({ where: { id: 1 } }),
    prisma.teamMember.findMany({ orderBy: { position: 'asc' } }),
  ]);
  renderHtml(res, adminInject(html, {
    resource: 'team',
    data: {
      eyebrow: r?.eyebrow ?? '', title: r?.title ?? '', description: r?.description ?? '',
      members: members.map((m) => ({
        id: m.id, name: m.name, role: m.role, photoUrl: m.photoUrl, featured: m.featured,
      })),
    },
  }, req.session.email));
}

export async function renderAdminEditCareers(req, res) {
  const html = readFile('Admin Edit Careers.html');
  const r = await prisma.careersConfig.findUnique({ where: { id: 1 } });
  const openings = await prisma.jobOpening.findMany({
    select: { slug: true, code: true, title: true, location: true, type: true, summary: true },
    orderBy: { publishedAt: 'desc' },
  });
  renderHtml(res, adminInject(html, {
    resource: 'careers',
    data: {
      eyebrow: r?.eyebrow ?? '', title: r?.title ?? '', description: r?.description ?? '',
      benefits: parseJson(r?.benefits, []),
      openings,
    },
  }, req.session.email));
}

export async function renderAdminEditNews(req, res) {
  const html = readFile('Admin Edit News.html');
  const r = await prisma.newsSectionConfig.findUnique({ where: { id: 1 } });
  const stories = await prisma.newsStory.findMany({
    select: { slug: true, tag: true, date: true, photo: true, title: true, subtitle: true },
    orderBy: { publishedAt: 'desc' },
  });
  renderHtml(res, adminInject(html, {
    resource: 'news_section',
    data: {
      eyebrow: r?.eyebrow ?? '', title: r?.title ?? '', description: r?.description ?? '',
      stories,
    },
  }, req.session.email));
}

export async function renderAdminEditContact(req, res) {
  const html = readFile('Admin Edit Contact.html');
  const [r, socials] = await Promise.all([
    prisma.contactConfig.findUnique({ where: { id: 1 } }),
    prisma.socialLink.findMany({ orderBy: { position: 'asc' } }),
  ]);
  renderHtml(res, adminInject(html, {
    resource: 'contact',
    data: {
      eyebrow: r?.eyebrow ?? '', title: r?.title ?? '', subtitle: r?.subtitle ?? '',
      offices: parseJson(r?.offices, []),
      socials: socials.map((s) => ({ platform: s.platform, url: s.url })),
    },
  }, req.session.email));
}

export async function renderAdminJobEdit(req, res) {
  const html = readFile('Admin Job Edit.html');
  const slug = req.params.slug;
  const isNew = !slug || slug === 'new';
  let job = null;
  if (!isNew) {
    job = await prisma.jobOpening.findUnique({ where: { slug } });
    if (!job) return res.status(404).send('Opening not found');
  }
  renderHtml(res, adminInject(html, {
    resource: 'job',
    isNew,
    data: isNew ? null : {
      slug: job.slug, code: job.code, title: job.title, department: job.department,
      location: job.location, type: job.type, summary: job.summary, about: job.about,
      responsibilities: parseJson(job.responsibilities, []),
      requirements:     parseJson(job.requirements,     []),
      offer:            parseJson(job.offer,            []),
    },
  }, req.session.email));
}

export async function renderAdminNewsEdit(req, res) {
  const html = readFile('Admin News Edit.html');
  const slug = req.params.slug;
  const isNew = !slug || slug === 'new';
  let story = null;
  if (!isNew) {
    story = await prisma.newsStory.findUnique({ where: { slug } });
    if (!story) return res.status(404).send('Story not found');
  }
  renderHtml(res, adminInject(html, {
    resource: 'news',
    isNew,
    data: isNew ? null : {
      slug: story.slug, tag: story.tag, date: story.date, photo: story.photo,
      title: story.title, subtitle: story.subtitle, body: story.body,
    },
  }, req.session.email));
}

export function renderAdminLogin(_req, res) {
  // No payload for the login page — but cache-bust so browsers don't show
  // a stale "logged out but redirect didn't fire" state.
  renderHtml(res, readFile('Admin Login.html'));
}

// ---------- PUBLIC clean-URL renderers ---------------------------------
export function renderAllNews(_req, res) {
  renderHtml(res, readFile('All News.html'));
}
export function renderNewsArticle(req, res) {
  // Clean URL is /news/<slug>; the prototype's bottom-of-body script reads
  // ?id=<slug> from location.search. Inject a head-script that fakes the
  // query before the body script runs.
  const html = readFile('News Article.html');
  const slug = JSON.stringify(req.params.slug);
  const tag = `<script>(function(){
  if (!window.history || !history.replaceState) return;
  var u = new URL(location.href);
  if (!u.searchParams.get('id')) {
    u.searchParams.set('id', ${slug});
    history.replaceState(null, '', u.pathname + '?' + u.searchParams.toString());
  }
})();</script>\n`;
  renderHtml(res, injectIntoHead(html, tag));
}
export function renderAllOpenings(_req, res) {
  renderHtml(res, readFile('All Openings.html'));
}
export function renderJobPosting(req, res) {
  // Same pattern as renderNewsArticle — fake ?id=<slug> for the prototype's
  // bottom-of-body script that reads location.search.
  const html = readFile('Job Posting.html');
  const slug = JSON.stringify(req.params.slug);
  const tag = `<script>(function(){
  if (!window.history || !history.replaceState) return;
  var u = new URL(location.href);
  if (!u.searchParams.get('id')) {
    u.searchParams.set('id', ${slug});
    history.replaceState(null, '', u.pathname + '?' + u.searchParams.toString());
  }
})();</script>\n`;
  renderHtml(res, injectIntoHead(html, tag));
}
