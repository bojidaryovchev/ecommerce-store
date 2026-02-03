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

- **S3 Bucket** - Product images and file uploads
- **IAM User** - Application access credentials

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

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Push to main (infra/**)     Push to main (apps/**)             │
│         │                            │                           │
│         ▼                            ▼                           │
│  ┌─────────────────┐          ┌─────────────────┐               │
│  │ GitHub Actions  │          │  Vercel CI/CD   │               │
│  │ (infra-deploy)  │          │  (auto-deploy)  │               │
│  └────────┬────────┘          └────────┬────────┘               │
│           │                            │                         │
│           │ Uses:                      │ Uses:                   │
│           │ • AWS_ROLE_ARN             │ • DATABASE_URL          │
│           │ • PULUMI_CONFIG_PASSPHRASE │ • AUTH_*                │
│           │ • PULUMI_BACKEND_URL       │ • AWS_S3_*              │
│           │                            │                         │
│           ▼                            ▼                         │
│  ┌─────────────────┐          ┌─────────────────┐               │
│  │   AWS (Pulumi)  │          │  Vercel (Web)   │               │
│  │   • S3 Bucket   │─────────▶│  • Next.js App  │               │
│  │   • IAM User    │ outputs  │                 │               │
│  └─────────────────┘          └─────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow

1. **Infrastructure changes** (`infra/**`) → GitHub Actions → Pulumi deploys to AWS
2. **Web app changes** (`apps/web/**`) → Vercel CI/CD → Deploys to Vercel
3. **After infra deploy**, copy S3 credentials from Pulumi outputs to Vercel env vars

## Roadmap

- [ ] Stripe integration for payments
- [ ] Resend for transactional emails
- [ ] Product catalog schema
- [ ] Shopping cart & checkout
- [ ] Order management
- [ ] Search (evaluate Algolia vs PostgreSQL full-text)
- [ ] Admin dashboard
