# Supabase Phase 3

Project: `qvuqjpcxnnikbigixupb`

This folder contains the V4/V4.1 production migration history used as the
schema foundation for the rebuild. Apply the SQL files in filename order.

## Apply From Dashboard

1. Open the Supabase SQL Editor for the project.
2. Run each file in `supabase/migrations` in ascending filename order.
3. Keep real anon and service role keys out of committed files.

## Apply From CLI

After logging in and linking the project locally:

```bash
supabase link --project-ref qvuqjpcxnnikbigixupb
supabase db push
```

The local machine currently does not have the Supabase CLI installed.
