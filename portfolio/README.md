# Portfolio

A portfolio site with an admin panel for adding projects, editing your bio/education,
and (optionally) overriding the CSS — all on Cloudflare's free tier.

- **Frontend:** React + TypeScript + Vite, deployed as static files on Cloudflare Pages
- **Backend:** Cloudflare Pages Functions (serverless, bundled from `/functions`)
- **Content storage:** Cloudflare KV (your bio, education, categories, projects)
- **File storage:** Cloudflare R2 (uploaded project files/images)
- **Auth:** username + salted/hashed password stored as an encrypted Cloudflare secret,
  not a file — sessions are signed cookies, verified with HMAC (Web Crypto, no libraries)

Nothing here requires a paid plan. Free-tier limits (Pages: unlimited static requests;
Functions: 100,000 requests/day; KV: 100,000 reads + 1,000 writes/day; R2: 10GB storage)
are far beyond what a personal portfolio will ever use.

---

## 1. Local development (optional)

```bash
npm install
npm run dev
```

This runs the frontend only, against whatever `/api/*` you have available — for full
local testing including KV/R2, use `npx wrangler pages dev -- npm run dev` instead, after
filling in the commented-out bindings in `wrangler.toml`. Not required to deploy — you can
skip straight to Part 2.

## 2. Push this project to GitHub

```bash
cd portfolio
git init
git add .
git commit -m "Initial portfolio"
```

Create a new **private** repo on GitHub (Settings can be changed later), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## 3. Connect Cloudflare Pages to the repo

1. Go to the [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorize GitHub and pick your repo.
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. It'll fail to load real content right now — that's expected, you haven't
   created the KV namespace or set secrets yet. The next steps fix that.

Every future `git push` to `main` auto-redeploys the site.

## 4. Create the KV namespace (stores your content)

1. Dashboard → **Storage & Databases** → **KV** → **Create a namespace**. Name it
   something like `portfolio-content`.
2. Go to your Pages project → **Settings** → **Bindings** → **Add** → **KV namespace**.
   - Variable name: `PORTFOLIO_KV` (must match exactly — the code reads this name)
   - KV namespace: the one you just created
3. Save.

## 5. Create the R2 bucket (stores uploaded files)

1. Dashboard → **R2 Object Storage** → **Create bucket**. Name it e.g. `portfolio-files`.
2. Open the bucket → **Settings** → find **Public Development URL** → **Enable** → type
   `allow` to confirm. Copy the URL it gives you (`https://pub-xxxxxxxx.r2.dev`).
3. Back in your Pages project → **Settings** → **Bindings** → **Add** → **R2 bucket**.
   - Variable name: `PORTFOLIO_BUCKET`
   - R2 bucket: the one you just created
4. Same **Bindings** page → **Add** → **Environment variable** (not secret):
   - Name: `PUBLIC_BUCKET_URL`
   - Value: the `pub-xxxxxxxx.r2.dev` URL from step 2

Note: the Public Development URL is rate-limited by Cloudflare, which is expected and
fine for a personal portfolio's traffic — it's not meant for high-volume production CDN use.

## 6. Set your admin login (as encrypted secrets, never a file)

Generate your password hash locally — this never leaves your machine:

```bash
node scripts/hash-password.mjs "the password you want to log in with"
```

It prints something like `a1b2c3...:d4e5f6...` — copy the whole thing.

In your Pages project → **Settings** → **Bindings** → **Add** → **Secret**, add three:

| Variable name | Value |
|---|---|
| `ADMIN_USERNAME` | whatever username you want to log in with |
| `ADMIN_PASSWORD_HASH` | the full `salt:hash` string the script printed |
| `SESSION_SECRET` | any long random string (e.g. run `openssl rand -hex 32`) |

## 7. Redeploy

Bindings only take effect on the *next* deployment. Go to your Pages project →
**Deployments** → latest one → **Retry deployment** (or just push any small commit).

At this point your site is fully live at `<project-name>.pages.dev`, with a working
admin panel at `/admin`.

## 8. Point nikhil.is-a.dev at it

1. In your Pages project → **Custom domains** → **Set up a domain** → enter
   `nikhil.is-a.dev` → follow the prompts to add it. It'll show as pending until step 3.
2. Fork [github.com/is-a-dev/register](https://github.com/is-a-dev/register), add a file
   at `domains/nikhil.json`:
   ```json
   {
     "owner": { "username": "your-github-username", "email": "your-email@example.com" },
     "records": { "CNAME": "<your-project-name>.pages.dev" }
   }
   ```
   Open a pull request.
3. is-a.dev is on the public suffix list, so Cloudflare's dashboard can't finish adding it
   automatically — use their small helper tool at [cf-pages.is-a.dev](https://cf-pages.is-a.dev)
   to complete the connection (it walks you through a Cloudflare API token instead of raw
   `curl`).
4. Once the PR is merged (usually within a day or two), `nikhil.is-a.dev` goes live.

Until the PR merges, your site is already fully working at the `.pages.dev` address —
nothing is blocked on this step.

---

## Using the admin panel

Go to `/admin`, sign in, and you'll land on a dashboard with four tabs:

- **Home content** — your name, headline, bio, contact email, education entries
- **Categories** — add/rename/remove project categories (code, name, URL slug)
- **Projects** — add projects to a category, write a summary + full description,
  optionally attach an external link, and upload files (goes straight to R2)
- **Custom CSS** — optional. Anything typed here overrides the site's default styles

Changes save immediately to KV/R2 and appear on the public site on next page load —
no redeploy needed for content changes (only code changes need a redeploy).

## Troubleshooting

- **Admin login says "Admin credentials are not configured yet"** — you haven't set the
  three secrets in step 6, or haven't redeployed since (step 7).
- **File uploads fail** — check `PUBLIC_BUCKET_URL` is set exactly as the R2 Public
  Development URL, with no trailing slash, and that the R2 binding name is
  `PORTFOLIO_BUCKET`.
- **Content doesn't show up** — check the KV binding name is exactly `PORTFOLIO_KV`.
  Binding names are case-sensitive and must match the code.
- **`nikhil.is-a.dev` shows an error** — it hasn't finished propagating, or the PR to
  is-a-dev/register hasn't merged yet. The `.pages.dev` URL always works in the meantime.
