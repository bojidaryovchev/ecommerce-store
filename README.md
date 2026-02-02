# Ecommerce Store

A modern, full-stack ecommerce platform built with Next.js 16 and deployed on Vercel.

## Tech Stack

| Layer          | Technology                                                  |
| -------------- | ----------------------------------------------------------- |
| **Frontend**   | Next.js 16 (App Router, Turbopack), React 19, TailwindCSS 4 |
| **Backend**    | Next.js API Routes, Server Actions                          |
| **Database**   | Neon PostgreSQL, Drizzle ORM                                |
| **Auth**       | Auth.js (NextAuth v5) with Google OAuth                     |
| **Storage**    | AWS S3 (via Pulumi IaC)                                     |
| **Payments**   | Stripe _(planned)_                                          |
| **Emails**     | Resend _(planned)_                                          |
| **Search**     | PostgreSQL full-text / Algolia _(TBD)_                      |
| **Deployment** | Vercel (web), Pulumi (infra)                                |

## Project Structure

```
├── apps/
│   └── web/              # Next.js frontend
├── packages/
│   └── database/         # Drizzle schema & client
├── infra/                # Pulumi AWS infrastructure
└── scripts/              # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local database)

### Setup

```bash
# Install dependencies
pnpm install

# Start local PostgreSQL
docker compose up -d

# Generate database types
pnpm db:generate

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
```

## Available Scripts

| Script               | Description                             |
| -------------------- | --------------------------------------- |
| `pnpm dev`           | Start Next.js dev server with Turbopack |
| `pnpm build`         | Build for production                    |
| `pnpm lint`          | Run ESLint across all packages          |
| `pnpm db:generate`   | Generate Drizzle migrations             |
| `pnpm db:push`       | Push schema to database                 |
| `pnpm db:migrate`    | Run migrations                          |
| `pnpm db:studio`     | Open Drizzle Studio                     |
| `pnpm infra:preview` | Preview infrastructure changes          |
| `pnpm infra:up`      | Deploy infrastructure                   |

## Infrastructure

AWS resources managed with Pulumi:

- **S3 Bucket** - Product images and file uploads
- **IAM User** - Application access credentials

### AWS Configuration

```
[profile dev-sso]
sso_start_url = https://d-9967643ec3.awsapps.com/start
sso_region = eu-central-1
sso_account_id = 560875410618
sso_role_name = AdministratorAccess
region = eu-central-1
```

## Roadmap

- [ ] Stripe integration for payments
- [ ] Resend for transactional emails
- [ ] Product catalog schema
- [ ] Shopping cart & checkout
- [ ] Order management
- [ ] Search (evaluate Algolia vs PostgreSQL full-text)
- [ ] Admin dashboard
