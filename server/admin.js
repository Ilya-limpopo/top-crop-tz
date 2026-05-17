// Admin save endpoints — all PUT/POST/DELETE under /api/admin/*. Each
// endpoint validates required fields and returns 422 with a field-level
// error map on failure (consumed by the admin pages' save UI).

import express from 'express';
import { prisma, getNewsStoriesDict, getJobOpeningsDict, getSitePayload } from './data.js';
import { requireApiAuth } from './auth.js';

export const adminRouter = express.Router();
adminRouter.use(express.json({ limit: '1mb' }));
adminRouter.use(requireApiAuth);

// ---------- helpers ----------
function fail(res, fields, status = 422) {
  return res.status(status).json({ ok: false, errors: fields });
}
function str(v) { return typeof v === 'string' ? v : (v == null ? '' : String(v)); }
function nonEmpty(v) { return str(v).trim().length > 0; }
function jsonField(v) { return JSON.stringify(v); }

// Slugify in JS the same way the Admin News Edit / Admin Job Edit pages
// suggest in the URL slug field — keep server-side as the authority.
export function slugify(s) {
  return str(s).trim().toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(base, model, excludeId) {
  let s = base || 'untitled';
  let i = 1;
  while (true) {
    const existing = await model.findUnique({ where: { slug: s } });
    if (!existing || existing.id === excludeId) return s;
    i += 1;
    s = `${base}-${i}`;
  }
}

// ---------- intro ----------
adminRouter.get('/intro', async (_req, res) => {
  const r = await prisma.introConfig.findUnique({ where: { id: 1 } });
  res.json({ ok: true, data: r });
});
adminRouter.put('/intro', async (req, res) => {
  const { videoUrl, captions } = req.body || {};
  const errs = {};
  if (!nonEmpty(videoUrl)) errs.videoUrl = 'required';
  if (!Array.isArray(captions) || captions.length !== 3) errs.captions = 'must be 3';
  if (Object.keys(errs).length) return fail(res, errs);

  const r = await prisma.introConfig.upsert({
    where: { id: 1 },
    update: { videoUrl: str(videoUrl), captions: jsonField(captions) },
    create: { id: 1, videoUrl: str(videoUrl), captions: jsonField(captions) },
  });
  res.json({ ok: true, data: r });
});

// ---------- about ----------
adminRouter.put('/about', async (req, res) => {
  const { eyebrow, title, subtitle, body, photos, facts } = req.body || {};
  const errs = {};
  if (!nonEmpty(title)) errs.title = 'required';
  if (!Array.isArray(photos) || photos.length !== 5) errs.photos = 'must be 5 slots';
  if (!Array.isArray(facts)  || facts.length  !== 4) errs.facts  = 'must be 4';
  if (Object.keys(errs).length) return fail(res, errs);

  const r = await prisma.aboutConfig.upsert({
    where: { id: 1 },
    update: { eyebrow: str(eyebrow), title: str(title), subtitle: str(subtitle), body: str(body),
              photos: jsonField(photos), facts: jsonField(facts) },
    create: { id: 1, eyebrow: str(eyebrow), title: str(title), subtitle: str(subtitle), body: str(body),
              photos: jsonField(photos), facts: jsonField(facts) },
  });
  res.json({ ok: true, data: r });
});

// ---------- team ----------
adminRouter.put('/team', async (req, res) => {
  const { eyebrow, title, description, members } = req.body || {};
  const errs = {};
  if (!nonEmpty(title)) errs.title = 'required';
  if (!Array.isArray(members)) errs.members = 'must be array';
  if (Object.keys(errs).length) return fail(res, errs);

  // README §3.2: featured is single-select across members. Enforce here.
  let seenFeatured = false;
  const cleanMembers = members.map((m, i) => {
    const isFeatured = !!m.featured && !seenFeatured;
    if (isFeatured) seenFeatured = true;
    return {
      name: str(m.name),
      role: str(m.role),
      photoUrl: str(m.photoUrl),
      featured: isFeatured,
      position: i,
    };
  });

  await prisma.$transaction([
    prisma.teamConfig.upsert({
      where: { id: 1 },
      update: { eyebrow: str(eyebrow), title: str(title), description: str(description) },
      create: { id: 1, eyebrow: str(eyebrow), title: str(title), description: str(description) },
    }),
    prisma.teamMember.deleteMany(),
    prisma.teamMember.createMany({ data: cleanMembers }),
  ]);
  res.json({ ok: true });
});

// ---------- careers (section) ----------
adminRouter.put('/careers', async (req, res) => {
  const { eyebrow, title, description, benefits } = req.body || {};
  const errs = {};
  if (!nonEmpty(title)) errs.title = 'required';
  if (!Array.isArray(benefits) || benefits.length !== 4) errs.benefits = 'must be 4';
  if (Object.keys(errs).length) return fail(res, errs);

  const r = await prisma.careersConfig.upsert({
    where: { id: 1 },
    update: { eyebrow: str(eyebrow), title: str(title), description: str(description),
              benefits: jsonField(benefits) },
    create: { id: 1, eyebrow: str(eyebrow), title: str(title), description: str(description),
              benefits: jsonField(benefits) },
  });
  res.json({ ok: true, data: r });
});

// ---------- news section ----------
adminRouter.put('/news-section', async (req, res) => {
  const { eyebrow, title, description } = req.body || {};
  const errs = {};
  if (!nonEmpty(title)) errs.title = 'required';
  if (Object.keys(errs).length) return fail(res, errs);

  const r = await prisma.newsSectionConfig.upsert({
    where: { id: 1 },
    update: { eyebrow: str(eyebrow), title: str(title), description: str(description) },
    create: { id: 1, eyebrow: str(eyebrow), title: str(title), description: str(description) },
  });
  res.json({ ok: true, data: r });
});

// ---------- contact + socials ----------
adminRouter.put('/contact', async (req, res) => {
  const { eyebrow, title, subtitle, offices, socials } = req.body || {};
  const errs = {};
  if (!nonEmpty(title)) errs.title = 'required';
  if (!Array.isArray(offices) || offices.length !== 3) errs.offices = 'must be 3';
  if (!Array.isArray(socials)) errs.socials = 'must be array';
  if (Object.keys(errs).length) return fail(res, errs);

  const cleanSocials = socials
    .filter((s) => nonEmpty(s.platform))
    .map((s, i) => ({ platform: str(s.platform), url: str(s.url) || '#', position: i }));

  await prisma.$transaction([
    prisma.contactConfig.upsert({
      where: { id: 1 },
      update: { eyebrow: str(eyebrow), title: str(title), subtitle: str(subtitle),
                offices: jsonField(offices) },
      create: { id: 1, eyebrow: str(eyebrow), title: str(title), subtitle: str(subtitle),
                offices: jsonField(offices) },
    }),
    prisma.socialLink.deleteMany(),
    prisma.socialLink.createMany({ data: cleanSocials }),
  ]);
  res.json({ ok: true });
});

// ---------- news stories ----------
adminRouter.get('/news', async (_req, res) => {
  res.json({ ok: true, data: await getNewsStoriesDict() });
});

adminRouter.post('/news', async (req, res) => {
  const { slug, tag, date, photo, title, subtitle, body } = req.body || {};
  const errs = {};
  if (!nonEmpty(title)) errs.title = 'required';
  if (Object.keys(errs).length) return fail(res, errs);

  const base = slugify(slug || title);
  const finalSlug = await uniqueSlug(base, prisma.newsStory);
  const r = await prisma.newsStory.create({
    data: {
      slug: finalSlug,
      tag: str(tag), date: str(date), photo: str(photo),
      title: str(title), subtitle: str(subtitle), body: str(body),
    },
  });
  res.status(201).json({ ok: true, data: r });
});

adminRouter.put('/news/:slug', async (req, res) => {
  const cur = await prisma.newsStory.findUnique({ where: { slug: req.params.slug } });
  if (!cur) return res.status(404).json({ ok: false, error: 'not_found' });
  const { slug, tag, date, photo, title, subtitle, body } = req.body || {};
  const errs = {};
  if (!nonEmpty(title)) errs.title = 'required';
  if (Object.keys(errs).length) return fail(res, errs);

  let nextSlug = cur.slug;
  if (nonEmpty(slug) && slugify(slug) !== cur.slug) {
    nextSlug = await uniqueSlug(slugify(slug), prisma.newsStory, cur.id);
  }
  const r = await prisma.newsStory.update({
    where: { id: cur.id },
    data: {
      slug: nextSlug,
      tag: str(tag), date: str(date), photo: str(photo),
      title: str(title), subtitle: str(subtitle), body: str(body),
    },
  });
  res.json({ ok: true, data: r });
});

adminRouter.delete('/news/:slug', async (req, res) => {
  const r = await prisma.newsStory.deleteMany({ where: { slug: req.params.slug } });
  res.json({ ok: true, deleted: r.count });
});

// ---------- job openings ----------
adminRouter.get('/openings', async (_req, res) => {
  res.json({ ok: true, data: await getJobOpeningsDict() });
});

function jobPayload(body) {
  return {
    code: str(body.code),
    title: str(body.title),
    department: str(body.department),
    location: str(body.location),
    type: str(body.type),
    summary: str(body.summary),
    about: str(body.about),
    responsibilities: jsonField(Array.isArray(body.responsibilities) ? body.responsibilities : []),
    requirements:     jsonField(Array.isArray(body.requirements)     ? body.requirements     : []),
    offer:            jsonField(Array.isArray(body.offer)            ? body.offer            : []),
  };
}

adminRouter.post('/openings', async (req, res) => {
  const errs = {};
  if (!nonEmpty(req.body?.title)) errs.title = 'required';
  if (Object.keys(errs).length) return fail(res, errs);

  const base = slugify(req.body?.slug || req.body?.title);
  const finalSlug = await uniqueSlug(base, prisma.jobOpening);
  const r = await prisma.jobOpening.create({
    data: { slug: finalSlug, ...jobPayload(req.body) },
  });
  res.status(201).json({ ok: true, data: r });
});

adminRouter.put('/openings/:slug', async (req, res) => {
  const cur = await prisma.jobOpening.findUnique({ where: { slug: req.params.slug } });
  if (!cur) return res.status(404).json({ ok: false, error: 'not_found' });
  const errs = {};
  if (!nonEmpty(req.body?.title)) errs.title = 'required';
  if (Object.keys(errs).length) return fail(res, errs);

  let nextSlug = cur.slug;
  if (nonEmpty(req.body?.slug) && slugify(req.body.slug) !== cur.slug) {
    nextSlug = await uniqueSlug(slugify(req.body.slug), prisma.jobOpening, cur.id);
  }
  const r = await prisma.jobOpening.update({
    where: { id: cur.id },
    data: { slug: nextSlug, ...jobPayload(req.body) },
  });
  res.json({ ok: true, data: r });
});

adminRouter.delete('/openings/:slug', async (req, res) => {
  const r = await prisma.jobOpening.deleteMany({ where: { slug: req.params.slug } });
  res.json({ ok: true, deleted: r.count });
});

// ---------- aggregate read for Admin Home dashboard ----------
adminRouter.get('/summary', async (_req, res) => {
  const [news, jobs] = await Promise.all([
    prisma.newsStory.count(),
    prisma.jobOpening.count(),
  ]);
  res.json({ ok: true, data: { news, jobs } });
});

// ---------- public-payload preview (for the admin Preview button) -------
adminRouter.get('/preview-payload', async (_req, res) => {
  res.json({ ok: true, data: await getSitePayload() });
});
