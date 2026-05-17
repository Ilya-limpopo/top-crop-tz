// One-off inspector — prints the seeded data for verification.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const log = (label, val) => {
  console.log(`\n=== ${label} ===`);
  console.dir(val, { depth: null, maxArrayLength: null });
};

const parseJsonFields = (row, fields) => {
  if (!row) return row;
  const out = { ...row };
  for (const f of fields) if (out[f]) out[f] = JSON.parse(out[f]);
  return out;
};

const intro   = parseJsonFields(await prisma.introConfig.findUnique({ where: { id: 1 } }), ['captions']);
const about   = parseJsonFields(await prisma.aboutConfig.findUnique({ where: { id: 1 } }), ['photos', 'facts']);
const team    = await prisma.teamConfig.findUnique({ where: { id: 1 } });
const members = await prisma.teamMember.findMany({ orderBy: { position: 'asc' } });
const careers = parseJsonFields(await prisma.careersConfig.findUnique({ where: { id: 1 } }), ['benefits']);
const newsSec = await prisma.newsSectionConfig.findUnique({ where: { id: 1 } });
const contact = parseJsonFields(await prisma.contactConfig.findUnique({ where: { id: 1 } }), ['offices']);
const socials = await prisma.socialLink.findMany({ orderBy: { position: 'asc' } });
const stories = await prisma.newsStory.findMany({ orderBy: { publishedAt: 'desc' } });
const jobs    = await prisma.jobOpening.findMany({ orderBy: { publishedAt: 'desc' } });

log('IntroConfig', intro);
log('AboutConfig', about);
log('TeamConfig', team);
log('TeamMembers (' + members.length + ')', members.map(m => `${m.position}. ${m.name} — ${m.role}${m.featured ? ' [FEATURED]' : ''}`));
log('CareersConfig', careers);
log('NewsSectionConfig', newsSec);
log('ContactConfig', contact);
log('SocialLinks', socials.map(s => `${s.platform} → ${s.url}`));
log('NewsStory slugs (' + stories.length + ')', stories.map(s => `${s.date} · ${s.slug} — ${s.title}`));
log('JobOpening slugs (' + jobs.length + ')', jobs.map(j => `${j.code} · ${j.slug} — ${j.title} (${j.location})`));

// Spot-check JSON arrays inside one job:
const sample = jobs[0];
log('Sample job JSON arrays parsed (' + sample.slug + ')', {
  responsibilities: JSON.parse(sample.responsibilities),
  requirements: JSON.parse(sample.requirements),
  offer: JSON.parse(sample.offer),
});

await prisma.$disconnect();
