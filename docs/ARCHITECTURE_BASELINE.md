# Architecture Baseline (Phase 01)

## Goal
Move business logic out of UI components and into domain modules to support Android/iOS release hardening.

## Current Module Structure
- `modules/auth`: reserved for OTP/password auth flows.
- `modules/categories`: category matching and taxonomy logic.
- `modules/config`: runtime environment validation and configuration guards.
- `modules/notifications`: reserved for scheduling and preferences.
- `modules/settings`: reserved for account settings logic.
- `modules/sms`: SMS parsing and normalization logic.
- `modules/transactions`: transaction/bill persistence and domain operations.

## Implemented in Phase 01
- Extracted SMS parsing from `components/AddTransaction.tsx` to `modules/sms`.
- Extracted merchant-category matching from `components/AddTransaction.tsx` to `modules/categories`.
- Added shared transaction/bill storage module used by `App.tsx`.
- Added payment-candidate detection and queue storage modules.
- Added notification module storage and notification dispatch helpers.
- Added in-app notifications center screen with confirm/dismiss workflow.
- Added event-based SMS ingestion bridge (`masarify:payment-message`) to integrate future native listeners.
- Added native bridge hook (`window.masarifyNativePaymentMessage`) for Android SMS/notification adapters.
- Added standalone auth backend service scaffold for OTP, register, login, reset, and change-password flows.
- Added frontend auth module and auth gate flow with persisted local session bootstrap.
- Replaced backend auth in-memory persistence with Postgres-backed persistence and startup migrations.
- Added settings screen with password-change and logout lifecycle, plus token validation endpoint (`/auth/me`).
- Added Capacitor configuration and Android shell project as native runtime baseline.
- Added Android native ingestion scaffold:
  - SMS receiver (`SmsPaymentReceiver`)
  - Notification listener service (`PaymentNotificationListenerService`)
  - Bridge emitter (`NativeMessageBridge`) to web runtime.
- Added Android-native permissions bridge (`MasarifyNativePermissions`) for SMS + notifications status/requests.
- Added in-app permission orchestration UI in `AddTransaction` Parse SMS tab with denial fallback guidance.
- Added category domain state module with persistent parent/sub-category, tag, and person entities.
- Added category domain service layer with CRUD + validation for duplicates, invalid refs, and cycle-safe hierarchy updates.
- Added `CategoryManager` screen and integrated taxonomy metadata into transaction creation flow.
- Added dashboard quick action cards and bottom navigation cleanup for mobile tap targets/safe-area consistency.
- Added production-safe frontend shell setup:
  - Tailwind/PostCSS bundled build pipeline (no runtime CDN/import-map dependencies)
  - favicon assets and static head metadata wiring.
- Added environment separation and fail-fast startup checks:
  - frontend `VITE_AUTH_API_BASE_URL` validation with production localhost guard
  - backend mode-specific `.env.*` loading and strict JWT secret checks.
- Added backend runtime readiness state:
  - `/api/health` now reports degraded state details
  - `/api/health/ready` gates on DB bootstrap readiness
  - `/api/auth/*` routes are blocked with explicit `503` responses until backend is ready.

## Next Structural Steps
- Replace localStorage persistence with native-capable storage abstraction for mobile.
- Add repository interfaces per domain to decouple UI from storage details.
- Introduce notification and auth domain implementations under their module folders.
