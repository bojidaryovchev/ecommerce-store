# Ecommerce Store

A modern, full-stack ecommerce platform built with Next.js 16 and deployed on Vercel.

## Tech Stack

| Layer          | Technology                                                  |
| -------------- | ----------------------------------------------------------- |
| **Frontend**   | Next.js 16 (App Router, Turbopack), React 19, TailwindCSS 4 |
| **Backend**    | Next.js API Routes, Server Actions                          |
| **Database**   | Neon PostgreSQL, Drizzle ORM                                |
| **Auth**       | Auth.js (NextAuth v5) with Google OAuth                     |
| **Payments**   | Stripe (Checkout Sessions, webhooks, refunds, promo codes)  |
| **Emails**     | Resend (order confirmation, shipping notification)          |
| **Storage**    | AWS S3 (presigned uploads, orphan cleanup via Lambda)       |
| **Deployment** | Vercel (web), Pulumi (infra)                                |

## Features

### Storefront

- **Product catalog** — grid/list views, image galleries, breadcrumb navigation
- **Search** — real-time product search from the navbar
- **Filtering & sorting** — by category, price range, sort order
- **Pagination** — cursor-based across all list views
- **Product reviews** — star ratings, text reviews, purchase-gated submissions
- **Wishlist** — save/remove products, dedicated wishlist page

### Shopping & Checkout

- **Cart** — add/update/remove items, persisted via cookies (guest + authenticated)
- **Stripe Checkout** — hosted payment page with promotion code support
- **Order confirmation** — success page with order summary, confirmation email via Resend
- **Promotion codes** — admin-managed coupons and promo codes applied at checkout

### Customer Account (`/account`)

- **Profile** — view Google-linked account info
- **Addresses** — CRUD for shipping/billing addresses
- **Wishlist** — saved products
- **Orders** — order history, order detail with status timeline

### Admin Panel (`/admin`)

- **Dashboard** — live stats (revenue, orders, products, users)
- **Products** — CRUD with multi-image S3 uploads, pricing, stock management
- **Categories** — CRUD with slug generation
- **Orders** — list with status filters, detail view with status transitions
- **Coupons** — create/edit/delete discount rules (percent or fixed amount)
- **Promo codes** — create/toggle/delete customer-facing codes linked to coupons
- **Refunds** — issue full/partial Stripe refunds from order detail
- **Reviews** — moderate (approve/reject/delete) customer reviews
- **Order audit trail** — status history with actor tracking (admin, webhook, system)

### Infrastructure

- **Image uploads** — presigned S3 URLs, client-side upload, orphan cleanup via EventBridge + Lambda
- **Stripe webhooks** — `checkout.session.completed` handler for order creation + email
- **Caching** — `"use cache"` + `cacheTag()` / `revalidateTag()` across all queries
- **Auth middleware** — route protection via `proxy.ts`, role-based admin guards

## Project Structure

```
├── apps/
│   └── web/              # Next.js frontend + admin panel
├── packages/
│   └── database/         # Drizzle schema, validators & client
├── infra/                # Pulumi AWS infrastructure + Lambda
├── docs/                 # Reference documentation
└── scripts/              # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local database + Stripe CLI)

### Setup

```bash
# Install dependencies
pnpm install

# Start local PostgreSQL + Stripe CLI (webhook forwarding)
docker compose up -d

# Push schema to database
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

Create `.env.local` in `apps/web/`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce

# Auth
AUTH_SECRET=your-auth-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...    # From Stripe CLI or dashboard

# Resend (email)
RESEND_API_KEY=re_...

# AWS S3 (for file uploads)
AWS_REGION=eu-central-1
AWS_S3_BUCKET_NAME=ecommerce-uploads-<account-id>-dev
AWS_PROFILE=dev-sso  # For local dev with SSO
# AWS_S3_ACCESS_KEY_ID=     # Only needed in production (from Pulumi outputs)
# AWS_S3_SECRET_ACCESS_KEY= # Only needed in production (from Pulumi outputs)
```

### Running with AWS SSO (Local Development)

For S3 uploads to work locally:

```bash
# Ensure you're logged in to SSO
aws sso login --profile dev-sso

# Run dev server (auto-checks SSO session)
pnpm dev
```

> **Note:** The `dev` script automatically validates your SSO session before starting. If your session has expired, it will prompt you to re-authenticate.

## Available Scripts

| Script               | Description                                   |
| -------------------- | --------------------------------------------- |
| `pnpm dev`           | Start Next.js dev server (includes SSO check) |
| `pnpm build`         | Build for production                          |
| `pnpm lint`          | Run ESLint across all packages                |
| `pnpm type-check`    | Run TypeScript type checking                  |
| `pnpm format`        | Format code with Prettier                     |
| `pnpm db:generate`   | Generate Drizzle migrations                   |
| `pnpm db:push`       | Push schema to database                       |
| `pnpm db:migrate`    | Run migrations                                |
| `pnpm db:studio`     | Open Drizzle Studio                           |
| `pnpm infra:preview` | Preview infrastructure changes                |
| `pnpm infra:up`      | Deploy infrastructure                         |

## Infrastructure

AWS resources managed with Pulumi:

- **S3 Bucket** — Product images and file uploads
- **IAM User** — Application access credentials
- **Lambda** — Orphan upload cleanup (triggered by EventBridge schedule)

### Docker Compose (Local Development)

- **PostgreSQL 17** — local database
- **Stripe CLI** — webhook forwarding to `localhost:3000/api/webhooks/stripe` (auto-restarts on failure)

### Prerequisites

Install these global dependencies:

```bash
# Pulumi CLI
# Windows (PowerShell)
iwr https://get.pulumi.com/install.ps1 -UseBasicParsing | iex

# macOS/Linux
curl -fsSL https://get.pulumi.com | sh

# AWS CLI
# https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
```

### AWS SSO Setup (One-time)

1. **Configure AWS SSO profile:**

```bash
aws configure sso
```

Enter the following when prompted:

| Setting                 | Value                              |
| ----------------------- | ---------------------------------- |
| SSO session name        | `ecommerce` (or any name)          |
| SSO start URL           | Your organization's SSO URL        |
| SSO region              | `eu-central-1`                     |
| SSO registration scopes | _(leave blank, press Enter)_       |
| Account ID              | Your AWS account ID                |
| Role                    | `AdministratorAccess`              |
| CLI default region      | `eu-central-1`                     |
| CLI profile name        | `AdministratorAccess-<account-id>` |

2. **Login to AWS SSO:**

```bash
aws sso login --profile AdministratorAccess-<account-id>
```

3. **Verify credentials:**

```bash
aws sts get-caller-identity --profile AdministratorAccess-<account-id>
```

### Pulumi Backend Setup (One-time)

We use S3 as the Pulumi state backend (not Pulumi Cloud).

1. **Run the bootstrap script:**

```powershell
cd infra
.\bootstrap-pulumi-backend.ps1 -Profile "AdministratorAccess-<account-id>"
```

This creates:

- S3 bucket for Pulumi state (`pulumi-state-<account-id>`)
- Bucket versioning, encryption, and public access block

2. **Login to Pulumi S3 backend:**

```bash
pulumi login s3://pulumi-state-<account-id>?region=eu-central-1
```

3. **Initialize the stack:**

```bash
cd infra
pulumi stack init dev
# Enter a passphrase to encrypt secrets
```

### Running Pulumi Locally

```bash
# Set AWS profile for the session
$env:AWS_PROFILE = "AdministratorAccess-<account-id>"  # PowerShell
export AWS_PROFILE="AdministratorAccess-<account-id>"  # Bash

# Preview changes
cd infra
pulumi preview

# Deploy changes
pulumi up
```

### GitHub Actions Setup (CI/CD)

The repo includes workflows for automated infrastructure deployment using GitHub OIDC (passwordless AWS auth).

1. **Run the GitHub OIDC bootstrap script:**

```powershell
cd infra
.\bootstrap-github-oidc.ps1 -GitHubOrg "<your-username>" -GitHubRepo "ecommerce-store" -Profile "AdministratorAccess-<account-id>"
```

2. **Create GitHub Environments** (Settings → Environments):

Create two environments: `dev` and `prod`. Add the following secrets to **each environment**:

| Secret                     | Value                                                  |
| -------------------------- | ------------------------------------------------------ |
| `AWS_ROLE_ARN`             | `arn:aws:iam::<account-id>:role/github-actions-pulumi` |
| `PULUMI_CONFIG_PASSPHRASE` | The passphrase from stack init                         |
| `PULUMI_BACKEND_URL`       | `s3://pulumi-state-<account-id>?region=eu-central-1`   |

> **Tip:** You can add protection rules to the `prod` environment (e.g., required reviewers).

3. **Workflow triggers:**

| Workflow            | Trigger         | Action                 |
| ------------------- | --------------- | ---------------------- |
| `infra-preview.yml` | PR to `main`    | `pulumi preview`       |
| `infra-deploy.yml`  | Push to `main`  | `pulumi up` (dev)      |
| `infra-deploy.yml`  | Manual dispatch | `pulumi up` (dev/prod) |

### Vercel Deployment

The Next.js app is deployed to Vercel. After running `pulumi up`, get the S3 credentials:

```bash
cd infra
pulumi stack output --show-secrets
```

Add these environment variables in Vercel (Settings → Environment Variables):

| Variable                   | Value                                     | Environments |
| -------------------------- | ----------------------------------------- | ------------ |
| `DATABASE_URL`             | Neon connection string                    | Per env      |
| `AUTH_SECRET`              | Random secret (`openssl rand -base64 32`) | Per env      |
| `AUTH_GOOGLE_ID`           | Google OAuth client ID                    | All          |
| `AUTH_GOOGLE_SECRET`       | Google OAuth client secret                | All          |
| `STRIPE_SECRET_KEY`        | Stripe secret key                         | Per env      |
| `STRIPE_WEBHOOK_SECRET`    | Stripe webhook signing secret             | Per env      |
| `RESEND_API_KEY`           | Resend API key                            | All          |
| `AWS_REGION`               | `eu-central-1`                            | All          |
| `AWS_S3_BUCKET_NAME`       | From `bucketName` output                  | Per env      |
| `AWS_S3_ACCESS_KEY_ID`     | From `accessKeyId` output                 | Per env      |
| `AWS_S3_SECRET_ACCESS_KEY` | From `secretAccessKey` output             | Per env      |

> **Note:** Use different Pulumi stacks (`dev`, `prod`) to get credentials for each Vercel environment.

## Environment Variables Reference

### Where Each Variable Goes

| Variable                   | Local (`.env.local`) | GitHub Environments | Vercel |
| -------------------------- | -------------------- | ------------------- | ------ |
| **Database**               |                      |                     |        |
| `DATABASE_URL`             | ✅                   | ❌                  | ✅     |
| **Auth**                   |                      |                     |        |
| `AUTH_SECRET`              | ✅                   | ❌                  | ✅     |
| `AUTH_GOOGLE_ID`           | ✅                   | ❌                  | ✅     |
| `AUTH_GOOGLE_SECRET`       | ✅                   | ❌                  | ✅     |
| **Stripe**                 |                      |                     |        |
| `STRIPE_SECRET_KEY`        | ✅                   | ❌                  | ✅     |
| `STRIPE_WEBHOOK_SECRET`    | ✅                   | ❌                  | ✅     |
| **Email**                  |                      |                     |        |
| `RESEND_API_KEY`           | ✅                   | ❌                  | ✅     |
| **AWS S3 (Web App)**       |                      |                     |        |
| `AWS_REGION`               | ✅                   | ❌                  | ✅     |
| `AWS_S3_BUCKET_NAME`       | ✅                   | ❌                  | ✅     |
| `AWS_PROFILE`              | ✅ (SSO)             | ❌                  | ❌     |
| `AWS_S3_ACCESS_KEY_ID`     | ❌                   | ❌                  | ✅     |
| `AWS_S3_SECRET_ACCESS_KEY` | ❌                   | ❌                  | ✅     |
| **Pulumi (Infra CI/CD)**   |                      |                     |        |
| `AWS_ROLE_ARN`             | ❌                   | ✅ (both envs)      | ❌     |
| `PULUMI_CONFIG_PASSPHRASE` | ❌                   | ✅ (both envs)      | ❌     |
| `PULUMI_BACKEND_URL`       | ❌                   | ✅ (both envs)      | ❌     |

### CI/CD Architecture

```mermaid
flowchart LR
  subgraph GitHub Repository
    Apps[apps/**]
    Infra[infra/**]
  end

  Apps -->|push to main| Vercel[Vercel CI/CD] --> Web[Next.js App]
  Infra -->|push to main| GA[GitHub Actions] --> AWS[S3 + Lambda + IAM]
```

### Workflow

1. **Infrastructure changes** (`infra/**`) → GitHub Actions → Pulumi deploys to AWS
2. **Web app changes** (`apps/web/**`) → Vercel CI/CD → Deploys to Vercel
3. **After infra deploy**, copy S3 credentials from Pulumi outputs to Vercel env vars

## Roadmap

- [x] Stripe integration for payments
- [x] Resend for transactional emails
- [x] Product catalog schema
- [x] Shopping cart & checkout
- [x] Order management (customer + admin)
- [x] Product search and filtering
- [x] Admin dashboard with live stats
- [x] Promotion codes & coupons
- [x] Refund management
- [x] Product reviews
- [x] Wishlist
- [x] User account (profile, addresses, orders)
- [x] Order audit trail (status history)
- [ ] SEO metadata fields
- [ ] Product variants (size, color, options)
- [ ] Multi-currency support
- [ ] Shipping tracking (carrier, tracking number)
- [ ] Rate limiting
