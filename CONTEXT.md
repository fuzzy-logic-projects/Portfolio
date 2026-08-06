# CONTEXT.md

Briefing file for a new chat session on this project — read this instead of replaying
the whole conversation. This is the source of truth during the editing phase; README.md
has been removed from the repo for now (it described a deploy path that turned out to
need real-world corrections — see below).

**Built by:** Claude AI (Anthropic), commanded by Nikhil.

## What this is

A personal portfolio website for Nikhil. The homepage is meant to impress HR-type
visitors with animation; projects are organized into categories; a hidden `/admin`
panel lets Nikhil add projects, edit his bio/education/about content, and optionally
override CSS — without touching code. Entire stack runs on Cloudflare's free tier, zero
recurring cost.

## Stack

- Frontend: React 19 + TypeScript + Vite, React Router, Framer Motion, react-markdown +
  remark-breaks (for Markdown rendering of the bio and About content)
- Backend: Cloudflare Pages Functions (serverless, lives in `/functions`)
- Content storage: Cloudflare KV (JSON blobs — home content, categories, projects, custom CSS)
- File storage: Cloudflare R2 (uploaded project files/images, served via its Public Development URL)
- Auth: username + salted/hashed password as an encrypted Cloudflare secret (never a
  file); sessions are HMAC-signed cookies. Both built on Web Crypto only — no auth library.
- Deploy: GitHub repo connected to Cloudflare, auto-deploy on push to `main`
- Domain: nikhil.is-a.dev planned (free), not yet connected — see Known Issues below

## How it works

1. **Public pages** (`/`, `/about`, `/projects/:slug`) fetch `GET /api/content` once on
   load via `ContentContext`, which returns `{ home, categories, projects, customCss }`
   read straight from KV. No auth needed for this endpoint.
2. **Admin login** (`/admin`) posts to `POST /api/login`. The function verifies the
   password against the `ADMIN_PASSWORD_HASH` secret (PBKDF2), and on success sets an
   HttpOnly, signed session cookie (HMAC via `SESSION_SECRET`).
3. **Admin dashboard** (`/admin/dashboard`) checks `GET /api/me` on load; redirects to
   `/admin` if not authenticated. Each tab (Home / Categories / Projects / CSS) PUTs its
   whole JSON blob to a matching `/api/admin/*` endpoint, which re-checks the session
   cookie before writing to KV. The Home tab's `about` field (Markdown) is a plain
   passthrough — no backend schema, so nothing else needed changing when it was added.
   The CSS tab's theme color pickers are the same trick: no schema change, see
   "Custom CSS" below.
4. **File uploads** go through `POST /api/admin/upload` (also session-checked), which
   streams the file into R2 and returns its public URL.
5. **Custom CSS**, if set, is injected as a `<style>` tag at runtime by
   `CustomCssInjector` in `App.tsx`. The admin CSS tab (`CustomCssEditor.tsx`) now has a
   "Theme colors" section on top of the old free-text textarea: five `<input
   type="color">` pickers for Background/Primary/Secondary/Accent/Body text (`--bg`,
   `--gold`, `--beige`, `--accent-light`, `--text-primary`). No backend schema change —
   on save, the picked colors are serialized into a `:root { ... }` block wrapped in
   `/* theme:start */` / `/* theme:end */` marker comments and prepended to whatever's
   in the free-text box, so it round-trips (the markers get parsed back out into the
   pickers next time the tab opens) while still being just a plain string as far as KV
   and the backend are concerned. **Live preview:** while the CSS tab is mounted, an
   effect writes the current (unsaved) picker values into a separate `#theme-preview-
   draft` style tag appended after `#custom-overrides` — since the admin dashboard uses
   the same CSS variables as the public pages, the whole dashboard re-themes live as you
   pick, with nothing touched in KV until "Save changes." The draft tag is removed on
   unmount (leaving the CSS tab) so it never leaks into other tabs/pages unsaved.

## Structure

```
src/
  pages/          Home, About, CategoryPage, AdminLogin, AdminDashboard (routed pages)
  admin/          HomeEditor, CategoriesEditor, ProjectsEditor, CustomCssEditor (dashboard tabs)
  components/     SiteHeader (desktop/mobile nav), CategoryCard, ProjectCard, PageTransition,
                  Markdown (shared react-markdown wrapper), ScrollCue (guided-scroll hint)
  hooks/          useGuidedReveal — drives the first-scroll guided reveal (see Animation below)
  context/        ContentContext — fetches/caches site content, exposes refresh()
  lib/api.ts      typed fetch wrapper for every backend endpoint
  types.ts        shared content types (HomeContent incl. `about`, Category, Project, SiteContent)
  styles/global.css   design tokens (palette, fonts), resets, shared utility classes
functions/
  api/content.ts        GET public content
  api/login.ts, logout.ts, me.ts     auth
  api/admin/*.ts         PUT content updates + POST file upload, all session-checked
  _lib/auth.ts           PBKDF2 hashing + HMAC session tokens (Web Crypto only)
wrangler.toml     for THIS project, this is the live production binding config — see below
                  (not just local-dev-only, unlike a normal Pages project)
```

## Design

Concept: portfolio-as-index/card-catalog — ties to Nikhil's philosophy background and
his spaced-repetition flashcard app. Categories get short codes (CW / WA / DA), shown
next to nav links and used to number project entries (e.g. "WA-01"). The literal
"Portfolio — Index No. 01" hero eyebrow and the "Index" label above the header brand
name were both removed (Nikhil's call — decorative catalog flavor text, not load-bearing).

- Palette B: soft black `#1c1c1c` background, muted gold `#bfa181` + warm beige
  `#d4c5b0` accents, off-white `#e8e6e1` body text
- Fonts: Fraunces (display/headlines), IBM Plex Sans (body/UI), IBM Plex Mono (catalog
  codes, labels)
- Desktop and mobile have structurally different nav (hover top bar vs. hamburger
  menu). Hover effects scoped with `@media (hover: hover)`. `SiteHeader` now also takes
  an `email` prop and renders a "Get in touch ↗" `.btn.btn-primary` — last item in the
  desktop nav row (so it lands top-right) and as a centered CTA at the bottom of the
  mobile dropdown. Only rendered if an email is set, same condition as Home's contact
  section.
- Home's "Browse by category" eyebrow is now "Projects", using a new `.eyebrow--light`
  modifier (color: `--accent-light`) instead of the default muted eyebrow color. The
  "N entry / N entries" count on `CategoryCard` and the category listing page
  (`CategoryPage`) both now read "N Project / N Projects" instead.
- Framer Motion handles page transitions, staggered entrance animations, scroll
  reveals; respects `prefers-reduced-motion`.
- Category and project card tiles scale up slightly on hover (zoom): CategoryCard via
  plain CSS `:hover` (safe — the CSS target is the inner `<Link>`, not the
  framer-motion-animated wrapper); ProjectCard via framer-motion's `whileHover` prop
  instead of CSS, because framer's `animate` already sets an inline `transform` on that
  same element for its entrance animation, and inline styles beat stylesheet rules —
  a CSS `:hover { transform }` there would silently never apply.

### Animation: native scroll reveal (`useScrollReveal`)

**This replaces an earlier scroll-jacking approach** (`useGuidedReveal`, now deleted) that
intercepted wheel/touch/keyboard input and programmatically snapped the page to each
section. That felt fast/jumpy and — the actual bug that triggered the rewrite —
completely swallowed upward scrolling while its "intro" was active. `useScrollReveal`
fixes this by never touching scroll at all: it's a thin `IntersectionObserver` wrapper.
Each registered section is mounted in the DOM (so it still occupies layout space) but
held at `opacity: 0` / `pointerEvents: none` via a framer-motion `animate` state, and
flips to visible the moment it scrolls within 15% into the viewport (`rootMargin: '0px
0px -10% 0px'`). Once revealed, a section is unobserved and stays revealed — including
if the visitor scrolls back up past it — because scrolling is 100% native the entire
time (browser default speed/easing, arrow keys, trackpad momentum, all of it, in both
directions). Fully skipped (everything shown immediately) under `prefers-reduced-motion`.

- Home's steps: hero bio+role → categories grid → education (if any) → contact (if an
  email is set). Note the hero **headline itself is not a step** — see below.
- About's steps: the `about` Markdown is split on blank lines (the same boundary
  Markdown itself treats as a block separator) and each resulting block reveals as its
  own step, so headings/paragraphs/lists each animate in individually.
- This resets on every fresh mount of Home/About (including client-side route
  navigation, since `PageTransition` remounts on `location.pathname` change) — it isn't
  persisted across visits, by design; "entering the page" was interpreted as "each time
  you land on it."

### Headline-only first screen + typing animation

`.hero` on Home is now `min-height: 100dvh` with `justify-content: center`, and contains
**only** the headline and the scroll cue — no bio, no matter what. The bio (`hero__bio`
+ `hero__role`) was pulled out into its own `intro-section`, which is just another
`useScrollReveal` step below the fold. This guarantees the very first screen a visitor
sees is headline-only, regardless of scroll position or content length, which was a
specific ask (a busy hero felt less "neat and clean" than a clean title screen).

Both page headlines (Home's tagline, About's "About") render through a new
`TypewriterHeadline` component (`src/components/TypewriterHeadline.tsx`) instead of a
plain fade/slide-in `motion.h1`. It types the text out character-by-character once on
mount (speed auto-scales so short and long taglines both take roughly ~900ms total,
clamped to 18–55ms/char) and then stops for good — no looping, no repeat on re-render.
The blinking caret (`.typewriter-cursor` in global.css) disappears once typing
completes. The full text is always present in a visually-hidden `.sr-only` span so
screen readers get the real content immediately rather than a garbled mid-type fragment.
Skipped entirely (full text shown instantly, no cursor) under `prefers-reduced-motion`.

### Scroll cue timing (`ScrollCue`)

`ScrollCue` (`src/components/ScrollCue.tsx`) now manages its own visibility instead of
being driven by the reveal hook: it waits 3 seconds after mount before appearing, and
disappears for good the instant the visitor scrolls at all (a `scroll` listener removes
itself after firing once). It resets naturally on each fresh mount of Home/About, same
as the reveal steps above.

### Markdown content

`HomeContent.about` (new field) and `HomeContent.bio` both render through a shared
`<Markdown>` component (react-markdown + remark-breaks, so a single newline becomes a
line break, not just a double-newline paragraph break). Styled via `Markdown.css`
(scoped under `.markdown-content`), with a `compact` variant (smaller heading sizes)
used for the hero bio since it sits in a tighter space than the full About page. Admin's
Home tab has a "Bio" field (plain textarea, still just one line style-wise but now
renders Markdown) and a new "About (Markdown)" textarea with a placeholder/hint
explaining supported syntax. The About nav link/page always exists; if `about` is empty,
the page shows a plain "Add About content from the admin dashboard." message instead of
running the guided reveal (zero steps → hook no-ops).

## Categories set up so far

- **CW** — Content Writing (one article to add)
- **WA** — Coding, Web Apps (his flashcard app — live at
  fuzzy-logic-projects.github.io/flashcard-drill/ — is a natural fit here)
- **DA** — Data Analytics (future interest, no content yet)

## Status: LIVE

Deployed and working at **https://portfolio-oq1.pages.dev**. Admin login confirmed
working. Custom domain (nikhil.is-a.dev) not yet connected — deliberately deferred.

**This session's changes** (on top of the previous session's About page / Markdown /
scroll-reveal work) are built and type-checked/linted clean locally but **not yet
pushed/deployed**:
- Replaced the scroll-jacking `useGuidedReveal` hook with `useScrollReveal`
  (`IntersectionObserver`-based) — fixes fast/jumpy scroll feel and the bug where
  scrolling back up didn't work.
- `ScrollCue` now waits 3s before appearing and hides for good on first scroll, instead
  of being tied to the old hijack's "intro" state.
- New `TypewriterHeadline` component — one-time typing animation on both page
  headlines, no loop/repeat, reduced-motion safe, screen-reader safe.
- Home's hero is now a full-viewport, headline-only first screen; the bio moved into
  its own scroll-revealed section below it.
- Copy: "Browse by category" → "Projects" (white/`--accent-light`); "N entry/entries" →
  "N Project/Projects" (CategoryCard + CategoryPage).
- `SiteHeader` gained a "Get in touch" CTA (top-right on desktop, bottom of dropdown on
  mobile), gated on an email being set.
- Admin CSS tab gained a "Theme colors" section (5 color pickers) with live preview,
  layered on top of the existing free-text custom CSS box — see "Custom CSS" above for
  how it round-trips through the same plain-string `customCss` field.

Next step is the same as before: Nikhil reviews locally, then push to `main` to deploy.

## Cloudflare resource layout (important — not the classic setup)

Two separate Cloudflare resources exist under account `1a6cc68315bbd78bb69f94afa1abd5f7`,
both named "portfolio":

1. **A Worker**, Git-connected to `github.com/fuzzy-logic-projects/Portfolio`
   (`main` branch). This is what actually builds on every push. Its **Deploy command**
   (Settings → Build) is set to:
   ```
   npx wrangler pages project create portfolio --production-branch main || true && npx wrangler pages deploy dist --branch=main
   ```
2. **A Pages project** (no direct Git connection of its own) — this is the real deploy
   target. `portfolio-oq1.pages.dev` belongs to this one. Its bindings (KV/R2/vars) are
   sourced from `wrangler.toml` in the repo, not the dashboard — the dashboard's
   Bindings/Variables UI is locked and shows "managed through wrangler.toml." **Only
   Secrets** (ADMIN_PASSWORD_HASH, SESSION_SECRET) are still set via the dashboard
   (Settings → Variables and secrets), since secrets can't live in `wrangler.toml`.

Why this split exists: Cloudflare's dashboard now routes even "Pages tab → Connect to
Git" projects through Workers Builds, which creates a Worker, not a classic Pages
project. A classic Pages project had to be created via `wrangler pages project create`
chained into the deploy command above.

## Live config values

- KV namespace: `portfolio-content`, ID `3aba7a1e49d5444fb8e9abab175f6ed2`
- R2 bucket: `portfolio-files`, Public Development URL:
  `https://pub-ff689358cae24e9e985d57ad4fe797ff.r2.dev`
- Admin username: `nikhiladmin` (password/hash/session secret stored only as Cloudflare
  Secrets, not written here)
- `wrangler.toml` currently contains real `[[kv_namespaces]]`, `[[r2_buckets]]`, and
  `[vars]` blocks (not commented out) — this is required for this project, unlike the
  original assumption that it was local-dev-only.

## Known issues & fixes (for next session, or if redeploying from scratch)

1. **`npx wrangler deploy` fails with "Missing entry-point to Worker script or to
   assets directory"** — the default Deploy command Cloudflare assigns doesn't
   understand Pages projects. Fix: change Deploy command (Settings → Build) to
   `npx wrangler pages deploy dist`.
2. **`wrangler pages deploy` then fails with an Authentication error (code 10000)** —
   the auto-generated Workers Builds API token only has Workers Scripts/KV/R2
   permissions, not Pages. Fix: My Profile → API Tokens → edit the
   `Workers Builds - ...` token → add permission `Account > Cloudflare Pages > Edit`.
   (The dashboard's own "API token" picker in Settings → Build only offers
   "Create new token," not selecting an existing one — despite what Cloudflare's docs
   imply.)
3. **`wrangler pages deploy` then fails with "The Pages project 'portfolio' does not
   exist"** — because this was created as a Worker, not a Pages project, no such Pages
   project exists yet. Fix: chain a project-create step into the Deploy command (see
   the exact command above).
4. **New builds land as "Preview" deployments instead of "Production," so config
   changes don't actually go live** — `wrangler pages deploy` can't reliably detect
   branch context when invoked from inside a Worker's build environment. Fix: add
   `--branch=main` explicitly to the deploy command (already included above).
5. **Custom domain (`nikhil.is-a.dev`) — dashboard "Add custom domain" shows "Transfer
   DNS management" / wants full nameserver transfer.** This is wrong for an is-a.dev
   subdomain (Nikhil doesn't own is-a.dev's DNS). Root cause: is-a.dev is on the Public
   Suffix List, which blocks the normal dashboard flow for PSL-listed domains. **Fix:**
   call the Cloudflare API directly instead of the dashboard UI:
   - Create/reuse an API token scoped to `Cloudflare Pages: Edit`
   - POST to `https://api.cloudflare.com/client/v4/accounts/1a6cc68315bbd78bb69f94afa1abd5f7/pages/projects/portfolio/domains`
     with header `Authorization: Bearer <token>` and JSON body `{"name": "nikhil.is-a.dev"}`
   - A browser-based REST tool like reqbin.com works fine for this (no terminal needed;
     it executes server-side so it avoids browser CORS issues)
   - Then still submit the `is-a-dev/register` PR as normal (JSON file in `domains/`
     with a `CNAME` record pointing to `portfolio-oq1.pages.dev`), and wait for merge.
   - This whole step is **deferred for now** — not yet done.

## Next steps

1. Nikhil reviews the local changes (this session's scroll-reveal rewrite, typing
   headline, headline-only hero, copy changes, header CTA, admin color pickers — plus
   the still-unpushed prior session's About page/Markdown/hover-zoom/eyebrow-removal
   work), then push to `main` to deploy.
2. Log into `/admin` and fill in the "About (Markdown)" field if not already done — it's
   empty by default even though the page/nav link always exists.
3. Optionally try the new admin CSS tab's color pickers to retheme the site, or leave
   them untouched (default behavior is unchanged — the free-text box still works exactly
   as before if the pickers are never touched).
4. Connect `nikhil.is-a.dev` using the fix above, when ready.
5. Add remaining real content: the content-writing article, the flashcard app entry.
6. Nothing architecturally is unfinished — remaining work is the custom domain and
   populating content, not more code.
