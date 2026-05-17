// DB -> public-page payloads.
//
// Two shapes are exposed:
//   - getSitePayload(): the JSON object injected into Top Crop.html as
//     window.TOPCROP. Drives every section component in src/sections.jsx
//     and the intro in src/intro.jsx.
//   - getNewsStoriesDict() / getJobOpeningsDict(): the schemas that the
//     legacy news-data.js / careers-data.js scripts used to expose on
//     window. Served from /news-data.js and /careers-data.js so the
//     unchanged All News / News Article / All Openings / Job Posting /
//     Admin Home pages keep reading from window.NEWS_STORIES /
//     window.JOBS without any markup changes.

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const parseJsonField = (s, fallback) => {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
};

export async function getSitePayload() {
  const [intro, about, team, members, careers, newsSec, contact, socials] = await Promise.all([
    prisma.introConfig.findUnique({ where: { id: 1 } }),
    prisma.aboutConfig.findUnique({ where: { id: 1 } }),
    prisma.teamConfig.findUnique({ where: { id: 1 } }),
    prisma.teamMember.findMany({ orderBy: { position: 'asc' } }),
    prisma.careersConfig.findUnique({ where: { id: 1 } }),
    prisma.newsSectionConfig.findUnique({ where: { id: 1 } }),
    prisma.contactConfig.findUnique({ where: { id: 1 } }),
    prisma.socialLink.findMany({ orderBy: { position: 'asc' } }),
  ]);

  return {
    intro: {
      videoUrl: intro?.videoUrl ?? '',
      captions: parseJsonField(intro?.captions, []),
    },
    about: {
      eyebrow: about?.eyebrow ?? '',
      title:   about?.title ?? '',
      subtitle:about?.subtitle ?? '',
      body:    about?.body ?? '',
      photos:  parseJsonField(about?.photos, []),
      facts:   parseJsonField(about?.facts, []),
    },
    team: {
      eyebrow:     team?.eyebrow ?? '',
      title:       team?.title ?? '',
      description: team?.description ?? '',
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        photoUrl: m.photoUrl,
        featured: m.featured,
      })),
    },
    careers: {
      eyebrow:     careers?.eyebrow ?? '',
      title:       careers?.title ?? '',
      description: careers?.description ?? '',
      benefits:    parseJsonField(careers?.benefits, []),
    },
    news: {
      eyebrow:     newsSec?.eyebrow ?? '',
      title:       newsSec?.title ?? '',
      description: newsSec?.description ?? '',
    },
    contact: {
      eyebrow:  contact?.eyebrow ?? '',
      title:    contact?.title ?? '',
      subtitle: contact?.subtitle ?? '',
      offices:  parseJsonField(contact?.offices, []),
    },
    socials: socials.map((s) => ({ platform: s.platform, url: s.url })),
  };
}

export async function getNewsStoriesDict() {
  const stories = await prisma.newsStory.findMany({
    orderBy: { publishedAt: 'desc' },
  });
  const out = {};
  for (const s of stories) {
    out[s.slug] = {
      tag: s.tag,
      date: s.date,
      photo: s.photo,
      title: s.title,
      subtitle: s.subtitle,
      body: s.body,
    };
  }
  return out;
}

export async function getJobOpeningsDict() {
  const jobs = await prisma.jobOpening.findMany({
    orderBy: { publishedAt: 'desc' },
  });
  const out = {};
  for (const j of jobs) {
    out[j.slug] = {
      code: j.code,
      title: j.title,
      department: j.department,
      location: j.location,
      type: j.type,
      summary: j.summary,
      about: j.about,
      responsibilities: parseJsonField(j.responsibilities, []),
      requirements:     parseJsonField(j.requirements,     []),
      offer:            parseJsonField(j.offer,            []),
    };
  }
  return out;
}

// Safe inline JSON serialisation: prevent </script> from closing the host
// <script> tag, and escape U+2028 / U+2029 which JSON allows literally
// but JavaScript treats as line terminators. The separators are built
// via String.fromCharCode so this source file itself stays plain ASCII.
const _LSEP = String.fromCharCode(0x2028);
const _PSEP = String.fromCharCode(0x2029);
export function safeStringify(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .split(_LSEP).join('\\u2028')
    .split(_PSEP).join('\\u2029');
}
