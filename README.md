<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Masarify

Personal finance app focused on Egyptian users.

## Environment Setup

**Prerequisites:** Node.js

Frontend env files:
- Copy `.env.development.example` to `.env.development`
- Copy `.env.mock.example` to `.env.mock`
- Copy `.env.staging.example` to `.env.staging`
- Copy `.env.production.example` to `.env.production` and set real production URL

Backend env files:
- Copy `backend/.env.development.example` to `backend/.env.development`
- Copy `backend/.env.mock.example` to `backend/.env.mock`
- Copy `backend/.env.staging.example` to `backend/.env.staging`
- Copy `backend/.env.production.example` to `backend/.env.production`

`VITE_AUTH_API_BASE_URL` is required and validated at startup.
Production mode rejects localhost URLs.

## Run Locally

1. Install frontend dependencies: `npm install`
2. Install backend dependencies: `cd backend && npm install`
3. Run preflight checks:
   - Development: `npm run doctor`
   - Mock: `npm run doctor:mock`
   - Staging: `npm run doctor:staging`
4. Start profile:
   - Development: `npm run dev:all`
   - Mock (with seeded login user): `npm run dev:all:mock`
   - Staging routing profile: `npm run dev:all:staging`

Auth backend health endpoint:
- `GET http://localhost:4000/api/health`
- `GET http://localhost:4000/api/health/ready` (includes DB readiness check)

Mock profile test login:
- Mobile: `01012345678`
- Password: `Test@123456`
- Backend mock auth store defaults to in-memory (`AUTH_STORE=memory`), so local Postgres is not required.

Environment profile reference:
- `docs/ENV_PROFILES.md`

Mobile persistence:
- Core local app state now uses SQLite on native runtime (with schema versioning/migrations).
- Web and SQLite-unavailable fallback uses localStorage.
- Legacy localStorage keys are lazily backfilled into SQLite on first native read.

## Auth Backend (Required for Login/Register/Reset)

If backend is unreachable, auth screens show retry guidance and block OTP/login actions until connectivity is restored.

## Android Shell (Capacitor)

1. Add Android platform (first time): `npm run mobile:android:add`
2. Sync web build to Android: `npm run mobile:android:sync`
3. Open Android Studio: `npx cap open android`

Requirements:
- Android SDK + Android Studio
- JDK 21 (Capacitor 7 Android toolchain)

Runtime setup in app:
- Open `Add Transaction` -> `Parse SMS` and grant:
  - SMS access
  - Notification permission
  - Notification listener access (from system settings)
