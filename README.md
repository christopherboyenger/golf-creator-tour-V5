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

Supabase is not wired in this phase.

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

Copy `.env.example` to `.env.local` when backend wiring begins. Do not place
service role keys in client-exposed variables.
