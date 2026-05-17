# Top Crop Tanzania — Handoff for Claude Code

This package contains the complete front-end design prototype for **topcrop.tz**:
public website + private admin console. All pages are plain, self-contained
HTML/CSS/JS files. There is no build step, no framework dependency to install,
no external state — every page works by opening it in a browser.

Your job is to wire this front-end to a real backend so that:

1. The website renders **live content** (not the hard-coded demo content
   currently inlined into each page).
2. The admin console at `/admin/...` can **edit that content** behind a login,
   and changes appear on the public site immediately.

The existing visual design, layout, copy structure, animations, fonts and
interactions are the design spec — **do not change them** unless explicitly
asked. Your work is plumbing.

---

## 1. File inventory

### Public site (visitor-facing)

| File | Purpose |
|------|---------|
| `Top Crop.html` | Home page — scroll-driven intro video + About, Team, Careers, News & Media, Contact sections. |
| `News Article.html` | Single-story template. Hydrated from `news-data.js` via `?id=<slug>`. |
| `All News.html` | Archive page listing every story. Hydrated from `news-data.js`. |
| `Job Posting.html` | Single-opening template. Hydrated from `careers-data.js` via `?id=<slug>`. |
| `All Openings.html` | Archive page listing every open position. Hydrated from `careers-data.js`. |

### Public site source (currently loaded by `Top Crop.html`)

| File | Purpose |
|------|---------|
| `src/intro.jsx`     | Scroll-driven intro: video scrubber + 3 captions, step model. |
| `src/sections.jsx`  | About, Team, Careers, News, Contacts, Footer sections (React, Babel-transpiled in-browser). |
| `src/app.jsx`       | Top nav + section composition for the home page. |

### Public site content (the source-of-truth files to replace)

| File | Purpose |
|------|---------|
| `news-data.js`    | All news stories, keyed by slug. Schema documented at top of file. |
| `careers-data.js` | All open positions, keyed by slug. Schema documented at top of file. |

> Content for the Home-page sections (About, Team, Careers blurb, News heading,
> Contact) is **currently inlined** in `src/sections.jsx`. You will need to
> lift this into a backend store as part of the integration.

### Admin console (the editorial UI)

| File | Edits |
|------|-------|
| `Admin Login.html`        | Sign-in form. Currently a stub that redirects on any non-empty value. |
| `Admin Home.html`         | Section index + stats + Add news / Add opening quick actions. |
| `Admin Edit Intro.html`   | Intro: replace video, edit 3 captions. |
| `Admin Edit About.html`   | About: heading, subtitle, 5 photos, body, 4 facts. |
| `Admin Edit Team.html`    | Our Team: heading, description, member CRUD (photo + name + role + featured flag). |
| `Admin Edit Careers.html` | Careers: heading, description, 4 benefits + "Add opening" callout. |
| `Admin Edit News.html`    | News & Media: heading, description + "Add news" callout. |
| `Admin Edit Contact.html` | Contact: heading, subtitle, 3 offices, social links. |
| `Admin Job Edit.html`     | Create / edit a single opening. Reads `?id=<slug>` or `?new=1`. |
| `Admin News Edit.html`    | Create / edit a single news story. Reads `?id=<slug>` or `?new=1`. |

All admin pages share the same layout chrome: top bar with logo + user
+ logout, breadcrumbs, page header with title + Preview/Discard, content
sections each with heading on top + fields below, and a sticky save bar at the
bottom of the viewport with Reset/Save.

### Assets

| Path | Notes |
|------|-------|
| `uploads/Banana_box.mp4` | Intro video. |
| `uploads/<Name>_<Name>.png` | Team portraits, named after each person. |
| `uploads/<topic>.png` | All other photography for About + News sections. |

---

## 2. Visual system (do not change)

- **Type:** Helvetica Neue for UI text; Instrument Serif (italic) for display
  type. Loaded via Google Fonts in each HTML file's `<head>`.
- **Tokens:** all colours, spacing, shadows live in `:root` blocks inside each
  HTML file. Same palette across public + admin. Pick a canonical CSS file or
  extract these into a single shared stylesheet if you refactor — but the
  **values** must not change.
- **Italic emphasis in copy:** the design uses `*asterisks*` in user-entered
  headings to mark a word that should render italic. Implement this as a
  trivial replace at render time: `*foo*` → `<em>foo</em>`.

---

## 3. Required backend behaviour

You may pick any stack; suggested: **Node.js + Express + SQLite + Prisma**,
served from a single small server, with the existing HTML files as static
assets. Other stacks are fine if they're equally simple to host (PHP + MySQL;
Python + FastAPI + Postgres; etc.).

### 3.1. Authentication

- Single shared admin account for now (no team management UI yet).
- Credentials stored as env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`).
  Hash with argon2 or bcrypt.
- Login posts to `/api/auth/login` → returns an httpOnly session cookie.
- Logout: `/api/auth/logout`.
- All `/admin/*` routes and `/api/admin/*` endpoints require the cookie.
- 24-hour idle timeout; sliding refresh on activity.

### 3.2. Content domains

Wire these data domains. For each, expose `GET` (public + admin) and
`PUT/POST/DELETE` (admin only) endpoints under `/api`. Persist in a small SQL
database.

1. **Site config**
   - **Intro:** `videoUrl`, `captions[3] = { eyebrow, title, body }`.
   - **About:** `eyebrow`, `title`, `subtitle`, `photos[5] = { url }` (positions
     are fixed by the layout — 1 wide + 1 tall + 3 vertical), `body`,
     `facts[4] = { number, label }`.
   - **Team:** `eyebrow`, `title`, `description`, `members[] = { id, name, role, photoUrl, featured }`.
     `featured` is a single-select across all members.
   - **Careers:** `eyebrow`, `title`, `description`, `benefits[4] = { title, body }`.
   - **News (section):** `eyebrow`, `title`, `description`.
   - **Contact:** `eyebrow`, `title`, `subtitle`,
     `offices[3] = { label, headline, contact }` (Head Office, Operations,
     Press & Media — fixed slots), `socials[] = { platform, url }`.

2. **News stories** (`news-data.js` schema)
   ```ts
   { slug, tag, date, photo, title, subtitle, body /* multi-paragraph plain text */ }
   ```

3. **Job openings** (`careers-data.js` schema)
   ```ts
   { slug, code, title, department, location, type, summary, about,
     responsibilities: string[], requirements: string[], offer: string[] }
   ```

### 3.3. File uploads

- The admin uses standard `<input type="file">` for the intro video, About
  photos, team portraits, and news hero images.
- Replace the prototype's `URL.createObjectURL` previews with real uploads:
  POST file → backend stores under `/uploads/` (or S3, whatever you prefer) →
  returns a permanent URL → admin sets that URL on the content record.
- Accept JPG/PNG/WebP for images; MP4/WebM for the intro video.
- Cap intro video at ~25 MB. Cap images at ~10 MB. Strip EXIF; auto-orient.

### 3.4. Rendering pipeline

The current prototype's HTML files are static and pull from JS data files. You
should change this to: each public page is server-rendered from the DB on
request (or built via SSG at write-time and served from a CDN). Either is
fine; **the resulting HTML must match the current prototype byte-for-byte
visually**.

The two patterns that need replacing:

1. `news-data.js` / `careers-data.js`: stop shipping these as static files.
   Inject the equivalent JSON into the page from the server, or render the
   articles/listings server-side and remove these files entirely.
2. The inlined content arrays in `src/sections.jsx` (TEAM, NEWS, VACANCIES,
   FACTS, etc.): replace with data fetched from the backend on page load, or
   render server-side and remove the React paint cycle for content the user
   never interacts with.

You may keep React + Babel-in-browser for the intro animation specifically;
that machinery is non-trivial and is the visual centrepiece of the home page.
Everything else can be plain server-rendered HTML.

### 3.5. Admin save semantics

- Each admin page already shows a sticky "Save changes" button that turns on
  when the form is dirty. Wire it to a single `PUT /api/admin/<resource>`.
- Optimistic UI is fine; show "✓ Saved" inline for ~2 seconds (the prototype
  already does this — just call the backend instead of `setTimeout`).
- Server validates required fields; returns 422 with a field map on errors.
- Slug is auto-generated from title on first save if absent; sluggify in JS
  the same way for the optional "URL slug" field in the news editor.
- "Discard" / "Reset" actions: `confirm()` then reload; don't send a request.

### 3.6. Public URLs

Preserve the existing URL surface — admin pages already link to these:

| Public URL              | Backend route |
|-------------------------|---------------|
| `/`                     | `Top Crop.html` (the home page) |
| `/news`                 | `All News.html` |
| `/news/<slug>`          | `News Article.html?id=<slug>` |
| `/careers`              | `All Openings.html` |
| `/careers/<slug>`       | `Job Posting.html?id=<slug>` |
| `/admin/login`          | `Admin Login.html` |
| `/admin`                | `Admin Home.html` |
| `/admin/intro`          | `Admin Edit Intro.html` |
| `/admin/about`          | `Admin Edit About.html` |
| `/admin/team`           | `Admin Edit Team.html` |
| `/admin/careers`        | `Admin Edit Careers.html` |
| `/admin/news`           | `Admin Edit News.html` |
| `/admin/contact`        | `Admin Edit Contact.html` |
| `/admin/openings/new`   | `Admin Job Edit.html?new=1` |
| `/admin/openings/<slug>`| `Admin Job Edit.html?id=<slug>` |
| `/admin/news/new`       | `Admin News Edit.html?new=1` |
| `/admin/news/<slug>`    | `Admin News Edit.html?id=<slug>` |

Rewrite the prototype's existing `?id=...` query-string links to clean URLs
above when you refactor.

---

## 4. Migration path

1. Stand up the server skeleton + DB schema first.
2. Seed the DB from the prototype data — copy `news-data.js`, `careers-data.js`,
   and the inlined arrays in `src/sections.jsx` into seed scripts.
3. Replace `news-data.js` and `careers-data.js` consumption with server-rendered
   pages.
4. Replace the React-inlined section data with backend data.
5. Build the admin save endpoints; wire each admin page's form.
6. Add file-upload endpoints; replace `URL.createObjectURL` previews.
7. Add auth + cookie session; protect `/admin/*`.
8. Replace prototype `setTimeout` save mocks with real fetch calls.

---

## 5. Deployment

- Single small Node app behind nginx/Caddy is fine; or any PaaS (Render, Fly,
  Railway).
- Static assets (`/uploads/*`) should be served with long cache headers and
  versioned filenames.
- The intro video is 9 MB; serve with `Content-Disposition: inline` and a
  CDN if possible.
- HTTPS required.

---

## 6. Things that are intentional

- **Italic via `*asterisks*`** — not a markdown bug. Render as `<em>`.
- **Step-based intro animation** — colour-of-the-magic. Don't replace it with
  autoplay; the user must scroll. The video must scrub in both directions
  (1 wheel tick = 1/3 of the video).
- **Fixed 3-office layout in Contact** — don't make it a dynamic list. There
  are exactly three labels: Head Office, Operations, Press & Media.
- **Fixed 4-fact, 4-benefit grids** — same reasoning.
- **Tier-1 typography only** — Helvetica Neue + Instrument Serif. Don't pull
  in additional fonts.

---

## 7. Out of scope (do not implement)

- Multi-language. English only for now.
- Comments / likes / share counts.
- User-management UI for admins.
- Newsletter, RSS, sitemap (can come later).
- Analytics — assume Plausible/PostHog snippet will be dropped in by hand.

---

## 8. Acceptance

The handoff is done when:

- Opening `/` in a clean browser renders exactly what the prototype renders.
- Logging into `/admin/login` and changing a heading on `/admin/about`,
  pressing Save, then reloading `/` shows the new heading.
- Uploading a new team portrait on `/admin/team` and saving causes that
  portrait to appear on the home page's Team section without further work.
- Creating a new story under `/admin/news/new` causes it to appear on `/news`
  and at `/news/<auto-slug>` immediately.
- Same for openings.
- All existing visual interactions on the public site (intro scrub, nav fade,
  hover states, sticky save bars in admin) keep working.

Ship it.
