# CONTEXT.md

Briefing file for a new chat session on this project — read this instead of replaying
the whole conversation.

**Built by:** Claude AI (Anthropic), commanded by Nikhil.

## What this is

A personal portfolio website for Nikhil. The homepage is meant to impress HR-type
visitors with animation; projects are organized into categories; a hidden `/admin`
panel lets Nikhil add projects, edit his bio/education, and optionally override CSS —
without touching code. Entire stack runs on Cloudflare's free tier, zero recurring cost.

## Stack

- Frontend: React 19 + TypeScript + Vite, React Router, Framer Motion
- Backend: Cloudflare Pages Functions (serverless, lives in `/functions`)
- Content storage: Cloudflare KV (JSON blobs — home content, categories, projects, custom CSS)
- File storage: Cloudflare R2 (uploaded project files/images, served via its Public Development URL)
- Auth: username + salted/hashed password as an encrypted Cloudflare secret (never a
  file); sessions are HMAC-signed cookies. Both built on Web Crypto only — no auth library.
- Deploy: GitHub repo connected to Cloudflare Pages (auto-deploy on push to `main`)
- Domain: nikhil.is-a.dev (free), CNAME to the `.pages.dev` Pages URL

## How it works

1. **Public pages** (`/`, `/projects/:slug`) fetch `GET /api/content` once on load via
   `ContentContext`, which returns `{ home, categories, projects, customCss }` read
   straight from KV. No auth needed for this endpoint.
2. **Admin login** (`/admin`) posts to `POST /api/login`. The function verifies the
   password against the `ADMIN_PASSWORD_HASH` secret (PBKDF2), and on success sets an
   HttpOnly, signed session cookie (HMAC via `SESSION_SECRET`).
3. **Admin dashboard** (`/admin/dashboard`) checks `GET /api/me` on load; redirects to
   `/admin` if not authenticated. Each tab (Home / Categories / Projects / CSS) PUTs its
   whole JSON blob to a matching `/api/admin/*` endpoint, which re-checks the session
   cookie before writing to KV.
4. **File uploads** go through `POST /api/admin/upload` (also session-checked), which
   streams the file into R2 and returns its public URL.
5. **Custom CSS**, if set, is injected as a `<style>` tag at runtime by
   `CustomCssInjector` in `App.tsx`.

## Structure

```
src/
  pages/          Home, CategoryPage, AdminLogin, AdminDashboard (routed pages)
  admin/          HomeEditor, CategoriesEditor, ProjectsEditor, CustomCssEditor (dashboard tabs)
  components/     SiteHeader (desktop/mobile nav), CategoryCard, ProjectCard, PageTransition
  context/        ContentContext — fetches/caches site content, exposes refresh()
  lib/api.ts      typed fetch wrapper for every backend endpoint
  types.ts        shared content types (HomeContent, Category, Project, SiteContent)
  styles/global.css   design tokens (palette, fonts), resets, shared utility classes
functions/
  api/content.ts        GET public content
  api/login.ts, logout.ts, me.ts     auth
  api/admin/*.ts         PUT content updates + POST file upload, all session-checked
  _lib/auth.ts           PBKDF2 hashing + HMAC session tokens (Web Crypto only)
scripts/hash-password.mjs   run locally to generate ADMIN_PASSWORD_HASH
wrangler.toml     local dev config only — production bindings are set via Cloudflare dashboard
README.md         full step-by-step deployment walkthrough
```

## Design

Concept: portfolio-as-index/card-catalog — ties to Nikhil's philosophy background and
his spaced-repetition flashcard app. Categories get short codes (CW / WA / DA), shown
next to nav links and used to number project entries (e.g. "WA-01").

- Palette B: soft black `#1c1c1c` background, muted gold `#bfa181` + warm beige
  `#d4c5b0` accents, off-white `#e8e6e1` body text (added on top of Nikhil's original
  palette, which had no defined body-text color)
- Fonts: Fraunces (display/headlines), IBM Plex Sans (body/UI), IBM Plex Mono (catalog
  codes, labels)
- Desktop and mobile have structurally different nav (hover top bar vs. hamburger
  menu), not just a resized layout. Hover effects are scoped with
  `@media (hover: hover)` so nothing sticks on touch devices.
- Framer Motion handles page transitions, staggered entrance animations, and scroll
  reveals; respects `prefers-reduced-motion`.

## Categories set up so far

- **CW** — Content Writing (one article to add)
- **WA** — Coding, Web Apps (his flashcard app — live at
  fuzzy-logic-projects.github.io/flashcard-drill/ — is a natural fit here)
- **DA** — Data Analytics (future interest, no content yet)

## Status

Code is complete and builds cleanly (`npm run build` passes, Functions type-check
cleanly). **Not yet deployed.** Delivered to Nikhil as `portfolio.zip`.

## Next steps

1. Deploy per `README.md`: push to GitHub → connect Cloudflare Pages → create KV
   namespace + bind `PORTFOLIO_KV` → create R2 bucket + enable its Public Development
   URL + bind `PORTFOLIO_BUCKET` + set `PUBLIC_BUCKET_URL` → run `hash-password.mjs`
   and set the three secrets (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`,
   `SESSION_SECRET`) → redeploy.
2. Connect `nikhil.is-a.dev`: add it as a custom domain in Cloudflare Pages, PR a JSON
   file to github.com/is-a-dev/register, finish via cf-pages.is-a.dev.
3. Once live, log into `/admin` and add real content: the content-writing article, the
   flashcard app entry, and bio/education details.
4. Nothing architecturally is unfinished — remaining work is deployment and populating
   content, not more code.
