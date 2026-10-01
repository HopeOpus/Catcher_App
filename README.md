# Catcher web app

Catcher is a property registry: owners register valuables, anyone can verify an item in the public registry, and owners can report theft. This repository is the web app and the API the Catcher mobile app calls.

**Stack:** Next.js 16 (App Router), React 19, Tailwind 4 + shadcn/ui, Clerk (auth), Prisma 7 on Neon Postgres, Paystack (payments), Cloudinary (uploads), Resend (email), Vercel (hosting).

## Local setup

```bash
npm install                 # also runs prisma generate
cp .env.example .env.local  # fill in the values
npm run dev
```

Point `DATABASE_URL` at a development database (a Neon branch works well), never at production.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run typecheck` / `npm run lint` / `npm test` | Checks that CI runs on every PR |
| `npm run db:migrate` | Create and apply a migration against your dev database |
| `npm run db:migrate:deploy` | Apply pending migrations (production) |
| `npm run db:migrate:status` | Show which migrations a database has |
| `npm run db:seed` | Seed admin users from `ADMIN_EMAILS` |
| `npm run cron:setup` | Register cron-job.org jobs that call `/api/internal/cron/*` |

## Database migrations

Schema changes go through versioned migrations in `prisma/migrations`. Do not use `prisma db push` against shared databases.

### One-time baseline for an existing database

The production database was created before migrations existed. `0_init` describes that schema, so mark it applied instead of running it:

```bash
DATABASE_URL=<production url> npx prisma migrate resolve --applied 0_init
DATABASE_URL=<production url> npm run db:migrate:deploy
```

After that, every deploy that adds a migration needs `npm run db:migrate:deploy` run against production before the new code goes live. Migrations in this repo are written to be additive so the old code keeps working while they apply.

## Deployment

Vercel's GitHub integration builds and deploys: every PR gets a preview deployment and every push to `main` goes to production. GitHub Actions (`.github/workflows/deploy-vercel.yml`) runs typecheck, lint and tests on every PR.

## Where things live

- `app/` — pages and API routes (`app/api/*` is shared with the mobile app, which authenticates with a Clerk Bearer token)
- `lib/` — domain logic: checkout, coverage lifecycle, wallet, referrals, businesses, legal documents
- `components/` — UI; `components/ui` holds shadcn/ui primitives
- `prisma/` — schema, migrations and seed
- `tests/` — Vitest unit tests
