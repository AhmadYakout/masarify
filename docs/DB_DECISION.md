# Database Decision (Minimal and Practical)

## Decision
- Use one Postgres database for backend auth persistence.
- Do not add ORM in v1 backend (direct SQL only).
- Do not add cloud sync for app data in v1; keep app domain data local-first.

## Why This Fits
- Backend auth/OTP data must survive server restarts and deployments.
- A single SQL path avoids redundant in-memory + DB code branches.
- Direct SQL keeps complexity lower than introducing ORM/migration frameworks at this stage.

## Provider Choice
- Primary recommendation: Neon Postgres free tier.
- Rationale:
  - Vercel Postgres has been discontinued and moved to Neon.
  - Neon has a free plan suitable for early-stage auth workloads.

## What Is Persisted in Backend DB
- `users`
- `otp_requests`
- `verification_tokens`
- `otp_rate_events`

## What Stays Local on Mobile (Current)
- Transactions, bills, payment candidates, and in-app notifications.
- This remains local-first in current phase; cloud sync is explicitly deferred.

## References (official)
- Vercel Postgres deprecation notice:
  - https://vercel.com/changelog/vercel-postgres-is-now-neon
- Neon pricing:
  - https://neon.tech/pricing
- Vercel Marketplace providers (Neon, Supabase):
  - https://vercel.com/marketplace
- Supabase free plan details:
  - https://supabase.com/pricing
