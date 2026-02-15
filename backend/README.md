# Masarify Auth Backend

Minimal authentication backend for:
- OTP request and verification
- Register with mobile + OTP verification token + password
- Login with mobile + password
- Reset password with OTP verification token
- Change password (authenticated)

## Run Locally

1. Install dependencies:
   `npm install`
2. Configure environment:
   copy `.env.development.example` to `.env.development`
   then keep `AUTH_STORE=postgres`, replace placeholder `DATABASE_URL` credentials with real values
   and set a strong `JWT_SECRET` (minimum 16 chars in development)
3. Start dev server:
   `npm run dev`

Server runs on `http://localhost:4000` by default.

## Mock Profile (Seeded Test Login)

1. Copy `.env.mock.example` to `.env.mock`
   - keep `AUTH_STORE=memory` for zero-setup local testing
2. Start mock backend:
   `npm run dev:mock`
3. Seeded login user (auto-created on bootstrap):
   - Mobile: `01012345678`
   - Password: `Test@123456`

## Staging Profile (Real Routing Shape)

1. Copy `.env.staging.example` to `.env.staging`
2. Replace DB host/user/password and JWT secret with real staging values
3. Start staging profile:
   `npm run dev:staging`

## Production Environment

1. Copy `.env.production.example` to `.env.production`
2. Set secure values (`DATABASE_URL`, strong `JWT_SECRET`)
3. Build server: `npm run build`
4. Start server: `npm run start`

Backend startup fails fast if required env keys are missing.
Production startup also fails if `JWT_SECRET` is weak/default.
In development, server can start in degraded mode when DB bootstrap fails; check `GET /api/health/ready` and startup logs.

## API Endpoints

- `GET /api/health`
- `GET /api/health/ready` (returns `503` when DB is unavailable)
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password` (Bearer token required)

## Database

- Backend uses a single Postgres database via `DATABASE_URL`.
- On startup, required tables are auto-created (lightweight bootstrap migration).
- Recommended free production option: Neon Postgres free tier.

## Notes

- `AUTH_STORE=memory` keeps OTP/users in-process (mock profile default).
- `AUTH_STORE=postgres` persists OTP/users in Postgres.
- In non-production mode, OTP code is returned in `request-otp` response for local testing.
