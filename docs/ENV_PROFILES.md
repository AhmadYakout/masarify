# Environment Profiles

## Goal
Keep test/mock usage and staging routing fully separated with explicit files and scripts.

## Profiles
| Profile | Frontend Env | Backend Env | Purpose | Seeded Login |
|---|---|---|---|---|
| Mock/Test | `.env.mock` | `backend/.env.mock` | Local testing with seeded user and mock-friendly defaults (`AUTH_STORE=memory`) | Yes |
| Staging Routing | `.env.staging` | `backend/.env.staging` | Staging-like routing and production-like guardrails | No |

## Commands
| Action | Mock/Test | Staging Routing |
|---|---|---|
| Preflight check | `npm run doctor:mock` | `npm run doctor:staging` |
| Start frontend only | `npm run dev:frontend:mock` | `npm run dev:frontend:staging` |
| Start backend only | `npm run dev:backend:mock` | `npm run dev:backend:staging` |
| Start both | `npm run dev:all:mock` | `npm run dev:all:staging` |

## Mock Login Credentials
- Mobile: `01012345678`
- Password: `Test@123456`

Credentials come from `backend/.env.mock` and are auto-seeded on backend bootstrap when:
- `APP_SEED_TEST_USER=true`
- `TEST_LOGIN_MOBILE` and `TEST_LOGIN_PASSWORD` are set
- `AUTH_STORE=memory` (default for mock) or `AUTH_STORE=postgres` with a working `DATABASE_URL`

## Safety Rules
- `staging` profile blocks localhost API routing on frontend.
- `staging` profile rejects weak/default JWT secret.
- `staging` profile disallows test-user seeding.
- `doctor` checks verify profile-specific env integrity before startup.
