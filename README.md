# Farm Stand

A mobile-first payment app for honor-system farm stands, pop-ups, and table sales. Customers scan a QR code, pick products, and pay with Apple Pay or Venmo.

Built on Cloudflare Pages + Workers + D1 + R2. Any business with Stripe can use it.

## Features

- 📱 **Mobile-first storefront** — scan QR → pick products → pay in ~10 seconds
- 🍎 **Apple Pay** via Stripe Payment Request Button
- 💸 **Venmo** via deep link (pre-filled amount + handle)
- 🖼 **Admin panel** — manage products, upload images, set logo + brand colors
- 🔐 **Secure** — Stripe secret key never exposed to frontend, server-side price validation
- 🌍 **Multi-tenant** — each deployment is its own store

## Stack

- [Cloudflare Pages](https://pages.cloudflare.com/) — frontend + edge functions
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite database
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — image storage
- [Stripe](https://stripe.com/) — Apple Pay / card processing
- React + Vite + TypeScript + Tailwind CSS

---

## Deploy Your Own (Template Usage)

This repo is a GitHub Template. To spin up a new farm stand for a customer:

1. Go to `github.com/hecate-bot/farmstand` → **Use this template** → Create a new repository. Name it after the customer (e.g. `sunnyside-farmstand`).
2. Clone the new repo locally and follow the Setup steps below.
3. All Cloudflare resources (D1, R2, Pages) should be created fresh for each customer — they each get their own isolated deployment.
4. Once deployed, the customer's store URL goes on their QR code (Admin → QR Code).

Each deployment is fully independent. One customer's data, keys, and settings have no relation to any other.

---

## Setup

### Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`
- Cloudflare account
- Stripe account (for Apple Pay)

### 1. Clone & Install

```bash
git clone https://github.com/hecate-bot/farmstand.git
cd farmstand
npm install
```

### 2. Create D1 Database

```bash
wrangler d1 create farmstand
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "farmstand"
database_id = "YOUR_DATABASE_ID_HERE"
```

Run the schema:
```bash
wrangler d1 execute farmstand --file=schema.sql
```

### 3. Create R2 Bucket

```bash
wrangler r2 bucket create farmstand-assets
```

Enable public access in the Cloudflare dashboard:
- R2 → farmstand-assets → Settings → Public Access → Allow Access
- Note the public URL (looks like `https://pub-xxxx.r2.dev`)

Update `wrangler.toml`:
```toml
[vars]
R2_PUBLIC_URL = "https://pub-YOUR_ID.r2.dev"
```

### 4. Set ALLOWED_ORIGIN

Open `wrangler.toml` and set `ALLOWED_ORIGIN` to your Cloudflare Pages URL. If you don't know it yet, deploy first (step 5) and then come back to update it — the URL follows the pattern `https://farmstand-<hash>.pages.dev`.

```toml
[vars]
ALLOWED_ORIGIN = "https://your-project.pages.dev"
```

You can also set a custom domain here once you've configured one (e.g. `https://farmstand.yourdomain.com`).

### 5. Admin Password — First-Run Setup

No bootstrap step needed. The app has a **first-run setup mode**: when `admin_password_hash` is empty in the database (fresh install), the first visit to `/admin/login` accepts any password you type (minimum 8 characters) and sets it permanently. After that, the password is locked in and the normal login flow applies.

### 6. Deploy

```bash
npm run deploy
```

> If this is your first deploy, `wrangler` will prompt you to create a Pages project — follow the prompts and choose to connect it to your GitHub repo for automatic deploys on push.

### 7. Set Up Stripe + Apple Pay

1. Add your Stripe publishable + secret keys in the admin panel → Settings
2. In Stripe Dashboard → Settings → Apple Pay → Add New Domain → enter your Pages domain
3. Download the domain association file
4. Paste its content into Admin → Settings → Apple Pay Domain Association File
5. Save — the file is now served at `/.well-known/apple-developer-merchantid-domain-association`

### 8. Configure Venmo

In Admin → Settings, enter your Venmo business handle (e.g. `paleotreats`).

### 9. Add Products

Admin → Products → Add Product. Upload images, set prices, toggle active/inactive.

### 10. Generate QR Code

Admin → QR Code. Enter your custom domain if using one (e.g. `https://farmstand.paleotreats.com`). Download and print at 3×3" or larger.

---

## Custom Domain (e.g. farmstand.paleotreats.com)

In Cloudflare Dashboard:
- Pages → farmstand → Custom Domains → Add Custom Domain
- Enter `farmstand.paleotreats.com`
- Cloudflare auto-configures DNS if the domain is on Cloudflare

---

## Local Development

```bash
# Build the frontend first
npm run build

# Run with Wrangler (binds D1 + R2 locally)
npm run cf-dev
```

Note: Local R2 + D1 require local databases. For fastest dev, run `vite` directly (`npm run dev`) for the frontend and test API calls against the deployed worker.

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
│   │   ├── auth/           # Login, verify token
│   │   ├── products/       # CRUD
│   │   ├── settings/       # Store config
│   │   ├── upload/         # R2 image uploads
│   │   └── checkout/       # Stripe Payment Intent
│   └── .well-known/        # Apple Pay domain verification
├── schema.sql              # D1 database schema
└── wrangler.toml           # Cloudflare config
```

---

## Environment Variables (wrangler.toml)

| Variable | Description |
|---|---|
| `R2_PUBLIC_URL` | Public URL for your R2 bucket (e.g. `https://pub-xxxx.r2.dev`) |
| `ALLOWED_ORIGIN` | Your Pages URL — restricts CORS to this origin (e.g. `https://farmstand.pages.dev`) |
| `ENVIRONMENT` | `production` or `development` |

D1 and R2 bindings are configured via `wrangler.toml`, not env vars.

---

## License

MIT — use freely, attribution appreciated.
