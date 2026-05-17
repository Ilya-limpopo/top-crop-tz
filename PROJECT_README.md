# Top Crop Tanzania — running this thing

Original prototype + handoff spec live in [README.md](README.md). This file
covers how to run the wired-up app.

## Stack

- Node 20+ / Express 4 / Prisma 5 / SQLite (file `data.db`)
- argon2 for password hashing, signed httpOnly cookie for sessions
- multer for uploads, content-hashed filenames in `/uploads/`
- The original prototype HTML / CSS / JSX is unchanged in shape — admin
  forms now POST to real endpoints, public sections hydrate from the DB.

## Run it

```bash
npm install
npx prisma migrate dev          # creates data.db and applies the init migration
npm run db:seed                 # imports prototype content (news, jobs, sections)
npm run admin:hash -- "<your password>"  # prints argon2 hash
# put the hash into .env (ADMIN_PASSWORD_HASH=...) and set ADMIN_EMAIL
node server/index.js            # or `npm run dev` for nodemon
```

Open http://localhost:3000.

## Environment

`.env.example` is the template. Copy to `.env` and fill:

| Var | Purpose |
|---|---|
| `PORT` | HTTP port (default 3000) |
| `DATABASE_URL` | `file:../data.db` — Prisma's path is relative to `prisma/schema.prisma` |
| `ADMIN_EMAIL` | Login email |
| `ADMIN_PASSWORD_HASH` | argon2id hash. Generate with `npm run admin:hash -- "<password>"` |
| `SESSION_SECRET` | Long random string used to sign session cookies |

The seed-shipped credentials in `.env` are `admin@topcrop.tz` / `topcrop123`
— **change them before deploying**.

## URLs

Public:

| URL | Page |
|---|---|
| `/` | Home (Top Crop.html, with section data injected) |
| `/news` | News archive |
| `/news/<slug>` | Single story |
| `/careers` | Open positions |
| `/careers/<slug>` | Single opening |

Admin (auth required):

| URL | Page |
|---|---|
| `/admin/login` | Sign-in |
| `/admin` | Dashboard |
| `/admin/intro` | Intro: video + 3 captions |
| `/admin/about` | About: heading, photos, body, facts |
| `/admin/team` | Team: members CRUD, featured flag |
| `/admin/careers` | Careers section + benefits + opening list |
| `/admin/news` | News section heading + story list |
| `/admin/contact` | Contact: heading, offices, socials |
| `/admin/openings/new` / `/admin/openings/<slug>` | Single opening editor |
| `/admin/news/new` / `/admin/news/<slug>` | Single story editor |

## API

All `/api/admin/*` requires the session cookie (set by `POST /api/auth/login`).

| Method + path | What |
|---|---|
| `POST /api/auth/login` | Body `{email, password}` → sets cookie |
| `POST /api/auth/logout` | Clears cookie |
| `GET /api/auth/whoami` | Session probe |
| `PUT /api/admin/intro` | Body `{videoUrl, captions[3]}` |
| `PUT /api/admin/about` | Body `{eyebrow, title, subtitle, body, photos[5], facts[4]}` |
| `PUT /api/admin/team` | Body `{eyebrow, title, description, members[]}` (full replace) |
| `PUT /api/admin/careers` | Body `{eyebrow, title, description, benefits[4]}` |
| `PUT /api/admin/news-section` | Body `{eyebrow, title, description}` |
| `PUT /api/admin/contact` | Body `{eyebrow, title, subtitle, offices[3], socials[]}` |
| `POST /api/admin/news` | Create story |
| `PUT /api/admin/news/<slug>` | Update story |
| `DELETE /api/admin/news/<slug>` | Remove story |
| `POST /api/admin/openings` | Create opening |
| `PUT /api/admin/openings/<slug>` | Update opening |
| `DELETE /api/admin/openings/<slug>` | Remove opening |
| `POST /api/admin/upload` | multipart `file=` → `{url}` (content-hashed `/uploads/<sha>.<ext>`). 10 MB images, 25 MB videos. |

Validation errors come back as `422 {ok:false, errors:{<field>:'required'|...}}`.

## Layout

```
.
├── Admin *.html, Top Crop.html, All News.html, ...   <- prototype HTML, unchanged in shape
├── src/                                               <- prototype JSX (intro / sections / app)
├── uploads/                                           <- media
├── prisma/
│   ├── schema.prisma          <- Prisma schema (singletons + collections)
│   ├── seed.js                <- imports prototype content into the DB
│   └── seeds/
│       ├── news-data.js       <- moved out of project root after migration
│       └── careers-data.js
├── server/
│   ├── index.js               <- Express setup, route table
│   ├── auth.js                <- argon2 + signed-cookie session
│   ├── data.js                <- DB → JSON payload assemblers
│   ├── render.js              <- HTML inject + clean-URL renderers
│   ├── admin.js               <- /api/admin/* router
│   ├── upload.js              <- /api/admin/upload (multer + content-hash)
│   └── admin-app.js           <- shared client helper for every admin page
├── scripts/
│   └── hash-password.js       <- CLI argon2 hash generator
└── .env.example               <- template
```

## Deploy to Railway

The app is wired for Railway out of the box (Nixpacks-friendly + a
[`railway.json`](railway.json) for the start command and healthcheck).

1. **Create the project**
   - https://railway.app → New Project → *Deploy from GitHub repo* → pick this repo.
2. **Attach a Volume** (persistent storage for SQLite + uploads)
   - Service → Settings → Volumes → New Volume
   - Mount path: `/data`
   - Size: 1 GB is enough for several thousand images.
3. **Environment variables** (Service → Variables)
   ```
   NODE_ENV=production
   DATABASE_URL=file:/data/data.db
   UPLOADS_DIR=/data/uploads
   ADMIN_EMAIL=<your email>
   ADMIN_PASSWORD_HASH=<run `npm run admin:hash -- "<password>"` locally and paste>
   SESSION_SECRET=<run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and paste>
   ```
   (`PORT` is set automatically by Railway — don't override.)
4. **Deploy.** The build runs `npm install` (which runs `prisma generate`),
   then `npm start` (which runs `prisma migrate deploy` and starts the server).
   On the first boot the server detects an empty DB and runs the seed
   automatically; subsequent restarts skip the seed and keep your data.
5. **Generate a public domain**: Service → Settings → Networking → Generate Domain.
   Visit it and log in at `/admin/login` with the email + password you set above.

Re-deploys preserve data (it lives on the volume); they re-apply pending
migrations on start.

## Conventions

- `*foo*` in any user-entered text renders as `<em>foo</em>` (README §2).
- `\n` in section titles renders as `<br/>`.
- Team `featured` is single-select; the server enforces it on save.
- Photos / videos are stored under `/uploads/<sha>.<ext>` — same bytes →
  same filename, dedup automatic.
