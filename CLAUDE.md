# JKKN Solutions Hub - Claude Instructions

## What This Project Is

Unified platform for tracking all solutions JKKN provides - software, training, and content - aligned with the institutional vision: "To be a Leading Global Innovative Solutions provider."

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19 |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS 4, shadcn/ui |
| State | TanStack Query |
| Forms | React Hook Form + Zod |
| Auth | MyJKKN OAuth (internal) + Supabase Auth (external) |

## Project Structure

```
src/
├── app/              # Routes (App Router)
├── components/
│   ├── ui/          # shadcn components (21)
│   └── shared/      # Custom shared components
├── lib/
│   └── supabase/    # Supabase client (client, server, admin)
├── services/        # Data fetching services
├── actions/         # Server actions
├── types/           # TypeScript types (database.ts)
└── hooks/           # Custom React hooks
```

## Database

Migrations in `supabase/migrations/` - 11 files covering:
- Core: departments, clients, solutions
- Software: phases, builders, assignments, iterations, bugs, deployments
- Training: programs, sessions, cohort_members, assignments
- Content: orders, deliverables, production_learners, assignments
- Financials: payments, earnings_ledger, revenue_split_models
- Accreditation: publications, NIRF/NAAC metrics

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |

## Key Business Rules

1. **Assignment Thresholds:**
   - Software: ≤3L self-claim/HOD, >3L MD approval
   - Training: ≤2L self-claim/HOD, >2L MD approval
   - Content: ≤50K self-claim/HOD, >50K MD approval

2. **Partner Discount:** 50% auto-applied for yi, alumni, mou, referral

3. **Revenue Splits:**
   - Software: 40% JICATE, 40% Department, 20% Institution
   - Training Track A: 60% Cohort, 20% Council, 20% Infrastructure
   - Training Track B: 30% Cohort, 20% Dept, 30% JICATE, 20% Institution
   - Content: 60% Learners, 20% Council, 20% Infrastructure

## Environment Variables

See `.env.example` for required variables.

## Spec Reference

Full specification in `docs/SPEC.md` and `docs/features.json`.

---
*Project: JKKN Solutions Hub | URL: solutions.jkkn.ai*
