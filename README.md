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

### 4. Set Admin Password

Before first deployment, set an initial admin password via direct D1 query:

```bash
# Generate a hash — or just set it through the admin panel after first login
# For initial setup, temporarily set a known hash, then change it in admin settings
```

Or deploy first with an empty password and set it via the admin panel → Settings → Admin Password.

**First login with no password set will be rejected.** To bootstrap:
```bash
# Set initial password to "changeme" by running this SQL:
wrangler d1 execute farmstand --command="UPDATE stores SET admin_password_hash = 'bootstrap' WHERE id = 'default'"
```
Then set a real password via the admin panel.

> **Easier approach**: After first deploy, use the Cloudflare dashboard → D1 → farmstand → Console to run:
> ```sql
> UPDATE stores SET admin_password_hash = 'salt:hash' WHERE id = 'default';
> ```
> Or just deploy, visit `/admin/login`, and set the password via the Settings page (works if hash is empty — update Settings to check for empty hash and allow setup mode).

### 5. Deploy

```bash
npm run deploy
```

### 6. Set Up Stripe + Apple Pay

1. Add your Stripe publishable + secret keys in the admin panel → Settings
2. In Stripe Dashboard → Settings → Apple Pay → Add New Domain → enter your Pages domain
3. Download the domain association file
4. Paste its content into Admin → Settings → Apple Pay Domain Association File
5. Save — the file is now served at `/.well-known/apple-developer-merchantid-domain-association`

### 7. Configure Venmo

In Admin → Settings, enter your Venmo business handle (e.g. `paleotreats`).

### 8. Add Products

Admin → Products → Add Product. Upload images, set prices, toggle active/inactive.

### 9. Generate QR Code

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
| `R2_PUBLIC_URL` | Public URL for your R2 bucket |
| `ENVIRONMENT` | `production` or `development` |

D1 and R2 bindings are configured via `wrangler.toml`, not env vars.

---

## License

MIT — use freely, attribution appreciated.
