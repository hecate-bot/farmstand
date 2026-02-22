# Farm Stand

A mobile-first payment app for honor-system farm stands, pop-ups, and table sales. Customers scan a QR code, pick products, and pay with Apple Pay or Venmo.

Built on Cloudflare Pages + D1 + R2. Any business with a Stripe account can use it.

## Features

- 📱 **Mobile-first storefront** — scan QR → pick products → pay in ~10 seconds
- 🍎 **Apple Pay** via Stripe (Safari/iPhone)
- 💸 **Venmo** via deep link (pre-filled amount + handle)
- 🖼 **Admin panel** — manage products, upload images, set logo + brand colors
- 🔐 **Secure** — Stripe secret key never exposed to frontend, server-side price validation

## Stack

- [Cloudflare Pages](https://pages.cloudflare.com/) — frontend + edge functions
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite database
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — image storage
- [Stripe](https://stripe.com/) — Apple Pay / card processing
- React + Vite + TypeScript + Tailwind CSS

---

## Deploy Your Own (Template Usage)

This repo is a GitHub Template. To spin up a new farm stand:

1. Go to `github.com/hecate-bot/farmstand` → **Use this template** → Create a new repository named after the store (e.g. `sunnyside-farmstand`).
2. Clone the new repo and follow the Setup steps below.
3. All Cloudflare resources (D1, R2, Pages) must be created fresh for each store — every deployment is fully isolated.
4. Once live, the store URL goes on the QR code (Admin → QR Code → print at 3×3" or larger).

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`
- A Cloudflare account (free tier works)
- A Stripe account

Log into Wrangler before starting:
```bash
wrangler login
```

---

### 1. Clone & Install

```bash
git clone https://github.com/hecate-bot/farmstand.git my-store
cd my-store
npm install
```

---

### 2. Create D1 Database

```bash
wrangler d1 create farmstand
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "farmstand"
database_id = "paste-your-id-here"
```

Then apply the schema to the **remote** database (the `--remote` flag is required — without it, the schema only applies locally):

```bash
wrangler d1 execute farmstand --file=schema.sql --remote
```

After filling in real values locally, tell git not to track your `wrangler.toml` changes so customer-specific IDs are never committed back to the template:

```bash
git update-index --assume-unchanged wrangler.toml
```

---

### 3. Create R2 Bucket for Images

```bash
wrangler r2 bucket create farmstand-assets
```

Set up a public subdomain for the bucket in the Cloudflare dashboard:
- R2 → farmstand-assets → Settings → **Custom Domains** → Add domain

Use a subdomain dedicated to images — **not** the store's main domain (the main domain is for the app). A good pattern: `img.farmstand.example.com` or `assets.example.com`.

> **Don't** use the store's main URL (e.g. `farmstand.example.com`) for R2 — that's reserved for the app itself. Using it for R2 will cause a DNS conflict.

---

### 4. Deploy

```bash
npm run deploy
```

On first run, Wrangler will ask a few questions:
- **Project name**: use `farmstand` (or the store's name)
- **Production branch**: enter `main` ← important, don't use the project name here

After deploying you'll get a URL like `https://farmstand-abc123.pages.dev`.

**Connect GitHub for auto-deploys:**
Cloudflare Pages → farmstand → Settings → Build & Deployments → Connect to Git → select your repo, branch `main`, build command `npm run build`, output directory `dist`.

**Set production branch to `main`:**
Pages → farmstand → Settings → Builds & Deployments → Production branch → change to `main` → Save.
(If this is wrong, your custom domain will show "Nothing is here yet" even though the app works on the `.pages.dev` URL.)

---

### 5. Set Environment Secrets

Go to **Cloudflare Dashboard → Pages → farmstand → Settings → Environment Variables → Add variable** and set both as type **Secret** (not Text):

| Secret | Example value |
|---|---|
| `R2_PUBLIC_URL` | `https://img.farmstand.example.com` |
| `ALLOWED_ORIGIN` | `https://farmstand.example.com` |

`R2_PUBLIC_URL` is the public subdomain you set up for R2 in step 3.
`ALLOWED_ORIGIN` is the store's public URL (custom domain or `.pages.dev`). It restricts the API to only accept requests from that domain.

After adding secrets, redeploy so the worker picks them up:
```bash
npm run deploy
```

---

### 6. Add a Custom Domain

Cloudflare Dashboard → Pages → farmstand → Custom Domains → Add Custom Domain → enter the store URL (e.g. `farmstand.example.com`). Cloudflare auto-configures DNS if the domain is on Cloudflare.

Update `ALLOWED_ORIGIN` in the dashboard to match the custom domain, then redeploy.

---

### 7. Set Your Admin Password

Visit `/admin/login` on the live site. Since it's a fresh database with no password set, **the first password you type (8+ characters) becomes the permanent admin password** — no SQL or bootstrap step needed.

After that, the normal login flow applies. You can change the password anytime in Admin → Settings → Admin Password.

---

### 8. Configure the Store

Log into the admin panel and fill in:

1. **Store Identity** — name, logo (PNG/JPG/WebP, 160×160 px recommended, max 5 MB)
2. **Brand Colors** — primary, secondary, accent (live preview shown)
3. **Stripe Keys** — publishable key (`pk_live_...`) and secret key (`sk_live_...`)
4. **Venmo Handle** — your Venmo business handle without the `@` (e.g. `paleotreats`)

---

### 9. Set Up Apple Pay

Apple Pay works automatically on Safari/iPhone once your domain is registered with Stripe:

1. Stripe Dashboard → Settings → **Payment method domains** → **Add a new domain**
2. Enter the store's domain (e.g. `farmstand.example.com`)
3. Stripe gives you a domain ID — **no file to download**. The domain association file is served automatically by the app.
4. Stripe/Apple verification takes up to an hour. Once complete, the Apple Pay button appears automatically for Safari users with a card on file.

> **Note:** Apple Pay only appears in Safari on iPhone/Mac. It will not show in Chrome or other browsers — those customers use Venmo instead.

---

### 10. Add Products

Admin → Products → Add Product. Set name, price, description, and upload a photo. Toggle products active/inactive without deleting them.

---

### 11. Generate & Print the QR Code

Admin → QR Code. If you have a custom domain, enter it here so the QR code points to the right URL. Download and print at **3×3 inches or larger** for easy scanning.

---

## Environment Variables

| Variable | Set in | Description |
|---|---|---|
| `R2_PUBLIC_URL` | CF dashboard secret | Public URL of the R2 image bucket |
| `ALLOWED_ORIGIN` | CF dashboard secret | Store's public URL — restricts CORS |
| `ENVIRONMENT` | `wrangler.toml` | `production` or `development` |

The D1 `database_id` is a binding (not an env var) and must be set in `wrangler.toml`. It is specific to each deployment and should not be committed back to the template repo.

---

## Project Structure

```
farmstand/
├── src/                    # React frontend
│   ├── pages/              # Store + Admin pages
│   ├── components/         # ProductCard, CheckoutBar, etc.
│   └── lib/                # API client, Stripe helpers
├── functions/              # Cloudflare Pages Functions (API)
│   ├── api/
│   │   ├── auth/           # Login, logout, token verify
│   │   ├── products/       # CRUD
│   │   ├── settings/       # Store config
│   │   ├── upload/         # R2 image uploads
│   │   └── checkout/       # Stripe Payment Intent
│   └── .well-known/        # Apple Pay domain verification (auto-proxied from Stripe)
├── schema.sql              # D1 database schema
└── wrangler.toml           # Cloudflare config (fill in database_id per deployment)
```

---

## License

MIT — use freely, attribution appreciated.
