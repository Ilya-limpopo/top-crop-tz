// Seed script — imports prototype content into the DB.
//
// Sources:
//   - news-data.js                       → NewsStory rows
//   - careers-data.js                    → JobOpening rows
//   - inlined arrays in src/sections.jsx → all *Config singletons,
//     TeamMember, SocialLink rows
//   - inlined FACTS array in src/intro.jsx → IntroConfig.captions
//
// We re-execute the two browser-shaped data files in a vm sandbox to harvest
// `window.NEWS_STORIES` and `window.JOBS`. Everything else is reproduced
// here verbatim from the JSX (the JSX can't be eval'd safely outside React).

import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadWindowKey(relPath, key) {
  const code = readFileSync(path.join(__dirname, relPath), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window[key];
}

// ---------- Data lifted from src/intro.jsx FACTS ----------
const INTRO_CAPTIONS = [
  {
    eyebrow: 'Fact 01 / Scale',
    title: 'The Powerhouse of East Africa',
    body: 'Largest banana producer in East Africa. With expansive plantations and state-of-the-art agricultural practices, Top Crop leads the region in production volume — ensuring a consistent and reliable supply of premium bananas to meet growing demands.',
  },
  {
    eyebrow: 'Fact 02 / People',
    title: 'A Community of 10,000+',
    body: 'Our people are our greatest strength. We take pride in being a major employer, fostering a diverse workforce of over 10,000 dedicated professionals. Our commitment to safety, growth, and sustainable livelihoods drives every harvest.',
  },
  {
    eyebrow: 'Fact 03 / Reach',
    title: "Tanzania's Global Ambassador",
    body: 'The leading exporter of bananas in Tanzania. From the heart of Dar es Salaam to the global stage, we bridge the gap between local excellence and international markets — delivering the finest Tanzanian produce to consumers worldwide.',
  },
];

// ---------- Data lifted from src/sections.jsx ----------
//
// *foo* = italic emphasis at render time (README §2). \n in titles = <br/>.

const ABOUT = {
  eyebrow: 'About — Founded 2024',
  title: 'The future of *Tanzanian*\nagriculture, planted in Rufiji.',
  subtitle:
    'Founded in 2024 as a flagship investment of the Dubai-based D43, Top Crop is redefining the standards of large-scale fruit production in East Africa. Our operations are centred on a 6,600-hectare plantation in the Rufiji region — strategically located near the village of Nyamwage.',
  body:
    'We are more than just a banana producer; we are an innovation-driven agrotech hub. By integrating advanced agricultural technologies with sustainable land management, we ensure premium quality for the global market while fueling the regional economy. Our mission is deeply rooted in social impact — we are on a journey to create 10,000 jobs, providing stable livelihoods and fostering long-term prosperity for the people of Tanzania. *At Top Crop, we grow more than bananas; we grow opportunities.*',
  photos: [
    { url: 'uploads/Plantation-wide.png' },
    { url: 'uploads/Harvest.png' },
    { url: 'uploads/Logistics.png' },
    { url: 'uploads/Workers.png' },
    { url: 'uploads/Precision_irrigation.png' },
  ],
  facts: [
    { number: '6,600', label: 'Hectares of plantation' },
    { number: '10,000', label: 'Jobs target' },
    { number: '2024', label: 'Founded by D43' },
    { number: '#1', label: 'Producer in East Africa' },
  ],
};

const TEAM_SECTION = {
  eyebrow: 'Our Team — Global × Local',
  title: 'A *global family*\nof specialists.',
  description:
    'While we operate on a massive scale, the heart of Top Crop is a close-knit family of international and local experts. Our leadership brings decades of experience across agriculture, logistics, and corporate management — all working toward a shared vision of excellence.',
};

const TEAM_MEMBERS = [
  { name: 'Ramil Mingazov',       role: 'Chief Executive Officer', photoUrl: 'uploads/Ramil_Mingazov.png',       featured: true },
  { name: 'Lorenzo Marconato',    role: 'Banana Operations',       photoUrl: 'uploads/Lorenzo_Marconato.png',    featured: false },
  { name: 'Carlos Andres',        role: 'Palm Oil Division',       photoUrl: 'uploads/Carlos_Andres.png',        featured: false },
  { name: 'Eliya Jones',          role: 'Finance',                 photoUrl: 'uploads/Eliya_Jones.png',          featured: false },
  { name: 'Enock Baisi',          role: 'Legal Affairs',           photoUrl: 'uploads/Enock_Baisi.png',          featured: false },
  { name: 'Gil Levi',             role: 'Construction',            photoUrl: 'uploads/Gil_Levi.png',             featured: false },
  { name: 'Neema Haki',           role: 'Government Relations',    photoUrl: 'uploads/Neema_Haki.png',           featured: false },
  { name: 'Neema Kingson',        role: 'Human Resources',         photoUrl: 'uploads/Neema_Kingson.png',        featured: false },
  { name: 'Nicolas Tchumachenko', role: 'Procurement',             photoUrl: 'uploads/Nicolas_Tchumachenko.png', featured: false },
  { name: 'Ilya Kuznetsov',       role: 'Security',                photoUrl: 'uploads/Ilya_Kuznetsov.png',       featured: false },
];

const CAREERS = {
  eyebrow: 'Careers — Open Roles',
  title: 'Build your future *with us.*',
  description:
    'At Top Crop, we believe a company is only as strong as its people. We are constantly seeking educated, ambitious professionals who are ready to make a mark in the agrotech industry. We offer more than a job — we offer a career path in one of Africa\'s fastest-growing agricultural projects.',
  benefits: [
    { title: 'Professional Growth',    body: 'Continuous training and development programmes — agronomy school partnerships, mentorship, and global exposure.' },
    { title: 'Comprehensive Care',     body: 'Full medical insurance, family coverage and competitive compensation packages tied to international standards.' },
    { title: 'Work–Life Integration',  body: 'For site-based specialists, modern housing at the Administration Camp with transport, dining and on-site amenities.' },
    { title: 'Real Impact',            body: 'Be part of a project transforming the socio-economic landscape of Rufiji — your work compounds in lives changed.' },
  ],
};

const NEWS_SECTION = {
  eyebrow: 'News & Media',
  title: 'Latest updates *from the field.*',
  description:
    'Stay informed about the milestones that define our journey — expansion into new international markets, innovative product lines, strategic partnerships, social projects, and our participation in global agricultural exhibitions.',
};

const CONTACT = {
  eyebrow: 'Contact — Get in touch',
  title: "Let's grow something *together.*",
  subtitle:
    'Whether you are a potential partner, a global distributor, or looking to join our team — we would love to hear from you.',
  offices: [
    { label: 'Head Office',  headline: 'Dar es Salaam, Tanzania', contact: 'office@topcrop.tz' },
    { label: 'Operations',   headline: 'Rufiji Region, Nyamwage', contact: '+255 22 000 0000' },
    { label: 'Press & Media', headline: 'press@topcrop.tz',       contact: 'Mon–Fri · 9:00–18:00 EAT' },
  ],
};

const SOCIALS = [
  { platform: 'LinkedIn',    url: '#' },
  { platform: 'Instagram',   url: '#' },
  { platform: 'X / Twitter', url: '#' },
  { platform: 'YouTube',     url: '#' },
];

// ---------- Seed runner ----------
//
// Exported so server/index.js can call it on startup when the DB is empty
// (first deploy on a fresh Railway volume). The CLI invocation at the
// bottom of this file lets `npm run db:seed` still work locally.

export async function seedDb(prisma) {
  console.log('-> wiping existing rows');
  await prisma.jobOpening.deleteMany();
  await prisma.newsStory.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.socialLink.deleteMany();
  await prisma.introConfig.deleteMany();
  await prisma.aboutConfig.deleteMany();
  await prisma.teamConfig.deleteMany();
  await prisma.careersConfig.deleteMany();
  await prisma.newsSectionConfig.deleteMany();
  await prisma.contactConfig.deleteMany();

  console.log('-> seeding IntroConfig');
  await prisma.introConfig.create({
    data: {
      id: 1,
      videoUrl: 'uploads/Banana_box.mp4',
      captions: JSON.stringify(INTRO_CAPTIONS),
    },
  });

  console.log('-> seeding AboutConfig');
  await prisma.aboutConfig.create({
    data: {
      id: 1,
      eyebrow: ABOUT.eyebrow,
      title: ABOUT.title,
      subtitle: ABOUT.subtitle,
      body: ABOUT.body,
      photos: JSON.stringify(ABOUT.photos),
      facts: JSON.stringify(ABOUT.facts),
    },
  });

  console.log('-> seeding TeamConfig + members');
  await prisma.teamConfig.create({ data: { id: 1, ...TEAM_SECTION } });
  await prisma.teamMember.createMany({
    data: TEAM_MEMBERS.map((m, i) => ({ ...m, position: i })),
  });

  console.log('-> seeding CareersConfig');
  await prisma.careersConfig.create({
    data: {
      id: 1,
      eyebrow: CAREERS.eyebrow,
      title: CAREERS.title,
      description: CAREERS.description,
      benefits: JSON.stringify(CAREERS.benefits),
    },
  });

  console.log('-> seeding NewsSectionConfig');
  await prisma.newsSectionConfig.create({ data: { id: 1, ...NEWS_SECTION } });

  console.log('-> seeding ContactConfig + socials');
  await prisma.contactConfig.create({
    data: {
      id: 1,
      eyebrow: CONTACT.eyebrow,
      title: CONTACT.title,
      subtitle: CONTACT.subtitle,
      offices: JSON.stringify(CONTACT.offices),
    },
  });
  await prisma.socialLink.createMany({
    data: SOCIALS.map((s, i) => ({ ...s, position: i })),
  });

  console.log('-> seeding NewsStory rows from prisma/seeds/news-data.js');
  const NEWS_STORIES = loadWindowKey('seeds/news-data.js', 'NEWS_STORIES');
  for (const [slug, story] of Object.entries(NEWS_STORIES)) {
    await prisma.newsStory.create({ data: { slug, ...story } });
  }

  console.log('-> seeding JobOpening rows from prisma/seeds/careers-data.js');
  const JOBS = loadWindowKey('seeds/careers-data.js', 'JOBS');
  for (const [slug, job] of Object.entries(JOBS)) {
    await prisma.jobOpening.create({
      data: {
        slug,
        code: job.code,
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        summary: job.summary,
        about: job.about,
        responsibilities: JSON.stringify(job.responsibilities),
        requirements: JSON.stringify(job.requirements),
        offer: JSON.stringify(job.offer),
      },
    });
  }

  // ---------- Summary ----------
  const counts = {
    introConfig:        await prisma.introConfig.count(),
    aboutConfig:        await prisma.aboutConfig.count(),
    teamConfig:         await prisma.teamConfig.count(),
    teamMembers:        await prisma.teamMember.count(),
    careersConfig:      await prisma.careersConfig.count(),
    newsSectionConfig:  await prisma.newsSectionConfig.count(),
    contactConfig:      await prisma.contactConfig.count(),
    socialLinks:        await prisma.socialLink.count(),
    newsStories:        await prisma.newsStory.count(),
    jobOpenings:        await prisma.jobOpening.count(),
  };
  console.log('\nSeed complete. Row counts:');
  console.table(counts);
}

// CLI mode — run with `node prisma/seed.js` or via `npm run db:seed`.
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href;
if (isMain) {
  const prisma = new PrismaClient();
  seedDb(prisma)
    .catch((err) => { console.error(err); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
