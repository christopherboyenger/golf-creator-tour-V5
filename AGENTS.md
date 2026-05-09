# AGENTS.md - Golf Creator Tour Rebuild Instructions

## Product Goal

Rebuild the current Golf Creator Tour app as a 1:1 clone of the existing
V4/V4.1 production app.

Do not redesign the product.
Do not simplify the UX.
Do not change the navigation model.
Do not invent new features unless explicitly requested.

## Current Stack

- Next.js 15
- React 19
- TypeScript
- Supabase Auth + Database + Storage
- Stripe Checkout + Webhooks
- Vercel deployment
- Mobile-first responsive web app
- Dark premium GCT theme

## Core Product Loop

Connect socials.
Complete brand challenges.
Play creator matches.
Earn Tour Points.
Climb the leaderboard.
Qualify for the Golf Creator Open.

## Required Main Routes

- /
- /auth
- /auth/reset-password
- /onboarding
- /profile
- /compete
- /create
- /connect
- /messages
- /home
- /how-to-compete
- /referrals
- /settings
- /admin
- /apply
- /brands
- /terms
- /privacy-policy
- /terms-of-service

## Required Bottom Navigation

1. Profile -> /profile
2. Compete -> /compete
3. Create -> /create
4. Connect -> /connect

## Required Auth Model

This is an invite-only app.

No public app signup.

Correct flow:

External website application
-> Admin approval
-> Supabase Auth user created
-> Creator logs in with email and temporary Tour Member Number
-> Creator resets password
-> Creator completes onboarding
-> Creator enters dashboard

## Design Rules

- Preserve the current mobile-first app shell.
- Preserve the dark premium GCT design.
- Preserve the centered logo header.
- Preserve bottom tab navigation.
- Preserve full-screen sheets, modals, drawers, and celebration overlays.
- Use the screenshots in `/docs/screenshots` as visual reference.
- Match spacing, border radius, shadows, typography, and layout as closely as possible.
- Do not add emoji-heavy UI.
- Do not use generic SaaS dashboard styling.

## Engineering Rules

- Use TypeScript.
- Use reusable components.
- Keep Supabase access centralized in `/lib/supabase`.
- Keep API routes under `/app/api`.
- Add loading, empty, error, and success states.
- Preserve auth guards and middleware behavior.
- No fake production secrets.
- Use `.env.example` for required environment variables.
- Add TODO comments only where external credentials or real schema access is required.

## Review Guidelines

When reviewing PRs, check:

- Auth security regressions
- Middleware route protection
- Missing routes
- Broken navigation
- Supabase query mistakes
- Stripe checkout/webhook mistakes
- Visual drift from screenshots
- Missing empty states
- Mobile layout issues
