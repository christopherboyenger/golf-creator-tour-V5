# Golf Creator Tour V5

Clean rebuild scaffold for Golf Creator Tour V5.

This repository is intentionally starting from a fresh Next.js app. The V4 app,
screenshots, and docs are reference material only.

## Current Scope

- Next.js App Router scaffold
- Global GCT dark premium theme
- Dashboard app shell
- Centered app header
- Four-tab bottom navigation
- Placeholder settings drawer, notifications panel, and upgrade sheet
- Placeholder routes for all required app pages
- Supabase migration history and typed client helpers
- Phase 5 dashboard query layer for profile, leaderboard, challenges,
  notifications, match counts, and app-shell session actions
- Phase 6 profile page tabs for Overview, Social, and Badges with profile
  empty states, location editing, social connection, and accepted-match sections

Phase 6 is underway: auth and onboarding are wired to Supabase, and the profile
dashboard now exposes the creator home tabs with explicit loading, empty, and
success states where production actions are still being rebuilt.

## Local Setup

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Environment

Copy `.env.example` to `.env.local` for backend wiring. Do not place service
role keys in client-exposed variables.
