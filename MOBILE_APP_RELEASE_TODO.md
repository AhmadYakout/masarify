# Masarify Mobile App Release TODO Plan

## Objective

Ship Masarify as a production-grade mobile app to Google Play first, then the Apple App Store, with a clean modular architecture, polished UX/UI, and zero AI features in v1.

## Mandatory Scope Decisions

- Remove all AI features from product scope and implementation.
- Remove Egyptian Franco/Franko-Arab AI behavior and all AI-generated content flows.
- Deliver Android-first with automatic payment detection from SMS inbox and notification listener (where permitted), aligned to Google Play policy.
- Every detected payment candidate must require explicit user confirmation before transaction creation.
- Candidate confirmations must be delivered through both push/local notification and in-app notification center.
- Deliver iOS later with a compliant non-SMS-inbox fallback flow.

## Execution Status

- `Completed (Phase 01 kickoff)`: `T001`, `T002`, `T003`, `T004`, `T006`, `T007`.
- `Completed`: `T011`, `T012`, `T013`, `T014`, `T015`, `T016` (baseline backend + frontend auth scope).
- `Completed`: `D001`, `D002`, `D003`, `D004` (backend DB decision + implementation + guardrails).
- `Completed (baseline)`: `D005` (SQLite-first local persistence for core mobile entities).
- `Completed`: `T017` (session validation, logout, change-password baseline).
- `Completed`: `T045`, `T046` (Capacitor setup + Android shell baseline).
- `Completed (baseline)`: `T018`, `T019`, `T020`, `T021`, `T022`, `T039`, `R007`.
- `Completed (baseline)`: `T025`, `T026`, `T032`, `R005`.
- `Completed (baseline)`: `T055`, `T066`, `T067`, `T068`, `T069`, `T070`, `T071`.
- `Completed (hardening)`: `T067` proactive diagnostics extension (`doctor` preflight + DB-ready health endpoint + startup error mapping).
- `Completed (baseline)`: `T009`, `T010` (SQLite-first local persistence + schema versioning/migration scaffold).
- `In progress`: `T005`, `T008`, `R002`, `R003`, `R006`.
- `Completed`: `R001` (native ingestion scaffold baseline).
- `Progress notes`:
  - AI code paths removed from runtime and build configuration.
  - SMS parsing and merchant-category matching logic moved from UI component into `modules/`.
  - Transactions and recurring bills now persist through a shared storage module.
  - Payment candidate queue + notification state are persisted and shown in-app.
  - Notification center screen and bottom-nav unread badge are now integrated.
  - `typecheck` script added and passing.
  - Backend auth foundation added with OTP throttling and verification limits.
  - Frontend auth gate added for login/register/reset with OTP verification flow.
  - Auth backend migrated from in-memory storage to single Postgres database path.
  - Settings screen now includes password change and logout, with backend token validation guard.
  - Native bridge contract added for Android ingestion (`window.masarifyNativePaymentMessage`).
  - Capacitor Android project initialized and sync workflow added.
  - Android SMS receiver and notification listener now emit payment candidates into app bridge.
  - Native Android compile requires JDK 21 in local environment.
  - Added category domain persistence with parent/sub-category, tags, and person entities.
  - Added category CRUD management screen and integrated taxonomy metadata into transaction creation.
  - Added taxonomy validation guards for duplicate names, invalid references, and cycle-safe hierarchy updates.
  - Added dashboard quick action boxes and improved bottom bar tap-target/safe-area behavior.
  - Added Android-native permission bridge (`MasarifyNativePermissions`) for SMS + notifications status and requests.
  - Added Parse-SMS permission orchestrator UI with manual fallback path when permissions are denied.
  - Runtime issues identified from local run: Tailwind CDN production warning, missing favicon asset, and auth API connection-refused behavior when backend is down or misconfigured.
  - Replaced runtime Tailwind CDN/import-map setup with packaged Tailwind (PostCSS + local CSS pipeline).
  - Added frontend env validation module with strict production guard against localhost API URLs.
  - Added backend mode-aware env loading and startup fail-fast checks for required keys and weak production JWT secret.
  - Added auth backend health check and connection-aware auth error UX with retry guidance.
  - Added DB-ready health endpoint (`/api/health/ready`) and switched frontend health checks to readiness (not just process-up).
  - Added backend startup error mapping for common Postgres and port binding failures.
  - Added `npm run doctor` preflight to detect env/port/credential misconfiguration before running app flows.
  - Backend now starts in degraded mode when DB bootstrap fails, so health endpoints return actionable `503` instead of connection-refused crashes.
  - Auth endpoints are guarded by readiness middleware and return explicit degraded-state errors until DB is ready.
  - Cleared project cache/temp artifacts (`dist`, backend/Gradle/cache folders, npm cache) to reset local run state.
  - Removed default credential fallbacks and strengthened credential checks (JWT required + weak/default secret detection).
  - Added separated mock/staging environment profiles with dedicated env files, run scripts, and profile-specific doctor checks.
  - Added mock auto-seed login user flow (`APP_SEED_TEST_USER`) for fast end-to-end app testing.
  - Added dedicated command matrix for profiles: `dev:all:mock`, `dev:all:staging`, `doctor:mock`, `doctor:staging`.
  - Added web favicon assets to remove `/favicon.ico` 404 in local/prod shell.
  - Added explicit frontend/backend dev and prod run profiles in npm scripts.
  - Added repository `requirements.txt` baseline for Python tooling reproducibility.
  - Added SQLite-first persistence module for core mobile entities with schema versioning and migration pipeline (`v1`).
  - Added safe fallback to localStorage when SQLite is unavailable, including lazy backfill migration from legacy localStorage keys.
  - Refactored payment candidate lifecycle (detect/confirm/dismiss) into SMS domain workflows instead of view-owned logic.
  - Refactored manual transaction creation, bill operations, and category-linked transaction cleanup into domain services/workflows.
  - App shell now orchestrates feature modules with reduced business logic footprint and guarded category mutation error handling.

## Priority Model

- `P0`: release blocker for Google Play.
- `P1`: high-value stabilization and maintainability.
- `P2`: iOS rollout and post-launch hardening.

## Runtime Issues Addendum (2026-02-13)

| ID | Pri | Type | Depends On | Issue | Required Outcome |
|---|---|---|---|---|---|
| I001 | P0 | RPL | T055 | `cdn.tailwindcss.com` and runtime import-map usage were observed and were not production-safe. | Build must use packaged Tailwind + bundled dependencies only. |
| I002 | P0 | FIX | T066,T067 | `POST /api/auth/request-otp` can fail with `ERR_CONNECTION_REFUSED` when backend is not reachable. | Auth UX must handle backend-unavailable state with clear action and retry. |
| I003 | P1 | FIX | T069 | `favicon.ico` was missing in local/prod web shell. | Favicon and app icons must be present and wired. |
| I004 | P0 | CHG | T066 | Missing clear dev/prod environment separation can leak localhost defaults. | Strict `.env.development` / `.env.production` split with validation. |
| I005 | P1 | ADD | T070 | No `requirements.txt` exists for auxiliary Python tooling reproducibility. | Add minimal owned `requirements.txt` policy (pinned or intentionally empty baseline). |

## Requirement Addendum (2026-02-13)

| ID | Pri | Type | Depends On | TODO | Deliverable |
|---|---|---|---|---|---|
| R001 | P0 | ADD | T023,T024 | Add Android SMS inbox + notification-listener ingestion pipeline for payment message detection. | Unified ingestion flow for payment SMS candidates. |
| R002 | P0 | ADD | R001 | Add confirmation queue model so detected candidates stay pending until user confirms or dismisses. | Persistent pending-candidate queue with status lifecycle. |
| R003 | P0 | ADD | R002,T029 | Trigger dual notifications for each candidate: push/local notification + in-app notification center entry. | Candidate confirmation alerts in both channels. |
| R004 | P0 | FIX | R003 | Ensure confirmation action from notification or in-app center updates candidate state atomically. | Safe confirmation workflow with no duplicate transaction creation. |
| R005 | P0 | FIX | R004 | Add retry and fallback when push/local notification permission is denied. | Reliable in-app fallback for all users. |
| R006 | P0 | UI | T036,T037 | Add dedicated notifications center screen and integrate badge count into bottom navigation. | Clear pending-confirmation UX and unread indicators. |
| R007 | P0 | UI | T036 | Fix bottom navigation layout, safe-area behavior, tap targets, and action hierarchy. | Stable, mobile-safe, and clean bottom bar. |
| R008 | P0 | CHG | T052,R001,R003 | Extend Play Console permission/disclosure package for SMS + notification access justification. | Policy-ready declarations aligned with runtime behavior. |

## Database Addendum (2026-02-13)

| ID | Pri | Type | Depends On | TODO | Deliverable |
|---|---|---|---|---|---|
| D001 | P0 | CHG | T012 | Finalize backend DB strategy: single Postgres (no ORM), no dual data path. | Clear, minimal persistence architecture. |
| D002 | P0 | ADD | D001 | Implement backend auth persistence on Postgres for users/OTP/tokens/rate events. | Durable auth and OTP state across restarts/deploys. |
| D003 | P0 | FIX | D002 | Add DB operational guardrails: migration bootstrap, env validation, startup fail-fast. | Predictable backend startup and schema baseline. |
| D004 | P0 | CHG | D001,D002 | Add deployment-ready free-tier provider config guidance (Neon first). | Practical production deployment baseline. |
| D005 | P1 | ADD | T009 | Add local SQLite persistence for mobile domain entities (transactions/bills/categories/notifications). | Offline-first mobile data persistence. |
| D006 | P1 | CHG | D005 | Define minimal optional sync boundary (deferred, no v1 overengineering). | Explicit non-sync v1 stance with future extension point. |

## Change Type Legend

- `ADD`: new implementation.
- `REF`: refactor existing implementation.
- `CHG`: targeted change/edit.
- `RPL`: replace with better implementation.
- `PRG`: purge/remove redundant or unsafe implementation.
- `RES`: complete restructure.
- `FIX`: bug/risk fix.
- `UI`: UI/UX and styling cleanup.
- `UPG`: dependency/tooling upgrade.

## Ordered TODO Backlog (Importance + Dependencies)

| ID | Pri | Type | Depends On | TODO | Deliverable |
|---|---|---|---|---|---|
| T001 | P0 | CHG | - | Freeze Android v1.0 scope and remove all AI from requirements. | Signed-off product scope without AI. |
| T002 | P0 | CHG | T001 | Confirm Android SMS-read scope and iOS fallback scope. | Platform feature matrix and constraints doc. |
| T003 | P0 | CHG | T001 | Confirm auth requirements: mobile OTP + password + reset. | Auth requirements spec. |
| T004 | P0 | CHG | T001,T002,T003 | Confirm compliance scope: privacy policy, data safety, SMS permission declaration. | Compliance checklist baseline. |
| T005 | P0 | RES | T001 | Restructure app architecture into modules: `auth`, `transactions`, `categories`, `notifications`, `settings`, `sms`. | Target architecture and folder conventions. |
| T006 | P0 | PRG | T001 | Purge AI code, AI dependencies, AI prompts, AI UI entries, AI env vars. | No AI code path remains in app. |
| T007 | P0 | PRG | T006 | Remove AI copy from product messaging and metadata. | User-facing content fully AI-free. |
| T008 | P0 | REF | T005 | Refactor feature state into domain services + repositories (no view-owned business logic). | Logical separation of UI and domain logic. |
| T009 | P0 | ADD | T005 | Add persistence layer with SQLite (or equivalent Capacitor-native local DB). | Durable local data model for all core entities. |
| T010 | P0 | FIX | T009 | Add schema versioning and migration pipeline. | Forward-safe data migrations. |
| T011 | P0 | UPG | T005 | Add strict quality gates: lint, format, typecheck, test scripts. | Reproducible quality pipeline in CI. |
| T012 | P0 | ADD | T005 | Add minimal backend for OTP and auth session APIs. | Secure auth backend endpoints. |
| T013 | P0 | FIX | T012 | Add OTP throttling, expiry, attempt limits, abuse/rate limiting. | Production-safe OTP flow. |
| T014 | P0 | ADD | T012 | Implement registration flow: mobile number -> OTP verify -> create password -> confirm password. | Complete register UX and API integration. |
| T015 | P0 | ADD | T012 | Implement login flow with mobile number + password. | Functional sign-in flow. |
| T016 | P0 | ADD | T012 | Implement forgot-password flow with OTP reset. | Functional password reset flow. |
| T017 | P0 | FIX | T015,T016 | Secure session storage, token refresh/logout behavior, and auth guard routing. | Stable and secure session lifecycle. |
| T018 | P0 | RES | T005 | Redesign category domain model: parent category, sub-category, tags, person attribution. | Normalized taxonomy schema. |
| T019 | P0 | ADD | T018 | Add `person` entity support (e.g., expenses for son/family member). | Person-linked expense tracking model. |
| T020 | P0 | ADD | T018,T019 | Build category management CRUD UI with parent/sub/tag/person assignment. | Clean category management experience. |
| T021 | P0 | CHG | T020 | Update transaction entry flow to support hierarchical category + tags + person selector. | Accurate and structured transaction capture. |
| T022 | P0 | FIX | T020,T021 | Add validation rules for taxonomy and transaction mapping (duplicates, cycles, invalid refs). | Reliable and consistent data integrity. |
| T023 | P0 | ADD | T005 | Build modular SMS parsing engine (provider templates + parser normalizer). | Extensible parser module. |
| T024 | P0 | ADD | T023,T002 | Add Android SMS reader module for inbox scanning and candidate extraction. | On-device SMS ingestion for Android. |
| T025 | P0 | ADD | T024 | Add Android permission orchestrator: rationale screen, request flow, denial fallback. | Policy-compliant permission UX. |
| T026 | P0 | FIX | T024,T025 | Add manual paste/import fallback when SMS permission is denied or unavailable. | Unblocked capture flow in all cases. |
| T027 | P0 | FIX | T024 | Add PII-safe handling for SMS data (redaction in logs, local-only processing policy). | Safer sensitive-data handling. |
| T028 | P0 | CHG | T002 | Define iOS-compliant input alternative (paste/share/manual import only). | iOS strategy documented and implemented plan. |
| T029 | P0 | RES | T005 | Restructure notifications into modules: scheduler, channels, templates, preferences, dispatch. | Clean notification architecture. |
| T030 | P0 | ADD | T029 | Implement reminder notifications for bills/installments and due-date warnings. | Core local notification flows. |
| T031 | P0 | ADD | T029 | Add notification preferences in settings (on/off + reminder timing). | User-controlled notification settings. |
| T032 | P0 | FIX | T029,T030 | Add Android 13+ notification permission handling and channel strategy. | Runtime-safe notification behavior. |
| T033 | P0 | ADD | T005 | Build CRUD audit matrix across all entities and screens. | Entity-operation coverage matrix. |
| T034 | P0 | FIX | T033 | Close missing CRUD operations and standardize result/error handling. | Complete and predictable CRUD behavior. |
| T035 | P0 | FIX | T033 | Add destructive-action safeguards (confirm, undo where needed). | Reduced accidental data loss risk. |
| T036 | P0 | UI | T005 | Define sleek design system tokens (spacing, typography, colors, elevation, radius). | Visual foundation for elegant UI. |
| T037 | P0 | UI | T036 | Build reusable component library (buttons, inputs, cards, chips, tabs, sheets, list rows). | Consistent UI building blocks. |
| T038 | P0 | UI | T036,T037 | Redesign dashboard for clear hierarchy and clean information density. | Elegant dashboard baseline. |
| T039 | P0 | UI | T038 | Add quick action boxes on dashboard for high-priority actions. | Action-focused dashboard interactions. |
| T040 | P0 | UI | T037 | Improve forms UX for auth, transactions, categories, settings. | Faster, cleaner data entry experience. |
| T041 | P0 | UI | T037 | Add polished loading, empty, error, and offline states. | UX consistency in non-happy paths. |
| T042 | P0 | UI | T037 | Accessibility pass: tap targets, contrast, text scaling, semantic labels. | Accessibility baseline ready for review. |
| T043 | P0 | ADD | T005 | Build minimal account settings page with only necessary controls. | Lean and practical settings surface. |
| T044 | P0 | CHG | T043,T031 | Include in settings: profile basics, password change, notification prefs, privacy/legal links. | Necessary settings only, no bloat. |
| T045 | P0 | ADD | T005 | Initialize Capacitor and connect build pipeline. | Native wrapper integration. |
| T046 | P0 | ADD | T045 | Add Android project and run end-to-end on emulator/device. | Working native Android app shell. |
| T047 | P0 | CHG | T046 | Configure package id, app name, icons, splash, status bar, keyboard behavior. | Production-ready Android app shell config. |
| T048 | P0 | FIX | T046 | Add safe-area and full-mobile layout behavior (remove web-frame assumptions). | Proper native mobile layout. |
| T049 | P0 | ADD | T011 | Add automated tests: parser tests, CRUD tests, auth flow tests. | Core logic regression safety net. |
| T050 | P0 | ADD | T011,T049 | Add Android smoke E2E tests for install, login, add transaction, persistence, notifications. | Basic release confidence suite. |
| T051 | P0 | ADD | T046 | Configure signing pipeline and reproducible release AAB generation. | Signed release artifact process. |
| T052 | P0 | CHG | T004,T025,T051 | Prepare Play Console assets and disclosures, including SMS permission declaration package. | Store submission package ready. |
| T053 | P0 | FIX | T051,T052 | Internal testing cycle + pre-launch report remediation. | Green pre-launch quality status. |
| T054 | P0 | CHG | T053 | Staged rollout plan with monitoring checkpoints. | Controlled production release plan. |
| T055 | P0 | RPL | T005 | Replace CDN Tailwind/import-map runtime dependencies with packaged deterministic build setup (PostCSS/CLI + Vite bundle only). | Stable and offline-safe styling/build without production CDN warnings. |
| T056 | P1 | PRG | T055 | Remove deprecated and dead files/components after restructure. | Smaller and maintainable codebase. |
| T057 | P1 | ADD | T011 | Add CI pipelines for build, quality checks, tests, Android RC build. | Continuous validation pipeline. |
| T058 | P1 | UPG | T011 | Dependency audit and targeted upgrades with lockfile discipline. | Predictable dependency baseline. |
| T059 | P1 | ADD | T054 | Add runtime observability for crash/error and release health metrics. | Post-release operational visibility. |
| T066 | P0 | CHG | T011 | Separate frontend/backend runtime config into `.env.development` and `.env.production` with required key validation and fail-fast startup. | Deterministic environment isolation with no accidental localhost leakage. |
| T067 | P0 | FIX | T012,T066 | Harden auth API connectivity: startup health check, actionable UI error state, retry flow, and backend URL sanity checks. | No silent `ERR_CONNECTION_REFUSED` failure path in auth UX. |
| T068 | P0 | FIX | T055,T066 | Remove any remaining Tailwind CDN script and runtime import-map from `index.html`; ensure build-only dependency loading. | Production-safe frontend shell with deterministic assets. |
| T069 | P1 | FIX | T068 | Add `favicon.ico` and platform icon references (web + Android shell metadata alignment). | No favicon 404 and clean app/browser metadata. |
| T070 | P1 | ADD | T011,T066 | Create repository-level `requirements.txt` for auxiliary Python tooling reproducibility (minimal pinned baseline; explicitly empty if no Python deps). | Reproducible Python tooling contract without over-engineering. |
| T071 | P1 | ADD | T066,T067 | Add explicit dev/prod run profiles and scripts for frontend/backend boot commands and env loading. | Clean one-command startup per environment. |
| T060 | P2 | ADD | T045 | Add iOS project via Capacitor and run on simulator/device. | Working iOS shell. |
| T061 | P2 | CHG | T060,T028 | Implement iOS compliant transaction capture flow (no inbox read). | iOS-safe feature parity path. |
| T062 | P2 | UI | T060,T048 | iOS-specific UX polish for safe area, keyboard, and navigation behavior. | Native-feeling iOS UX. |
| T063 | P2 | CHG | T004,T060 | Prepare App Store privacy/compliance declarations and assets. | App Store Connect submission package. |
| T064 | P2 | FIX | T063 | TestFlight cycle and App Review issue closure loop. | App Store approval-ready build. |
| T065 | P2 | CHG | T064 | iOS staged rollout and monitoring plan. | Controlled iOS production release. |

## Explicit Purge / Refactor / Replace / Restructure Map

- `PRG`: remove `components/AICoach.tsx`.
- `PRG`: remove `services/aiService.ts`.
- `PRG`: remove deprecated AI service stubs and any AI env references.
- `PRG`: remove AI navigation/tab entry and any AI-related text in UI.
- `REF`: move parsing and business rules out of UI components into domain modules.
- `REF`: move all entity CRUD into repository/service layer with shared validation.
- `RPL`: replace ad-hoc styling patterns with shared design system tokens/components.
- `RPL`: replace runtime CDN/import-map dependencies with packaged build-time dependencies.
- `RPL`: replace localhost-default runtime coupling with explicit environment-specific configuration.
- `RES`: restructure folders by feature/domain for auth, transactions, categories, notifications, settings, sms.
- `RES`: restructure notifications codebase into scheduler + provider + preference + template modules.

## CRUD Coverage Checklist (Must Be Green)

- Transactions: create, read/list, edit, delete, filter, assign category/sub-category/tags/person.
- Categories: create parent, create sub-category, edit, archive/delete, reorder/visibility.
- Tags: create, rename, delete, attach/detach from transactions.
- Persons: create, rename, deactivate, attach/detach expense attribution.
- Bills/installments: create, edit, mark paid/unpaid, delete, reminder linkage.
- Notification preferences: create/update/read, reset to defaults.
- Auth/profile: register, verify OTP, login, forgot password, change password, logout.

## UI/UX Quality Requirements

- Interface must be visually clean, sleek, and consistent.
- Dashboard must include quick action boxes for key workflows.
- Forms must minimize friction and typing effort.
- Typography, spacing, and color usage must follow a single design system.
- States must be complete: loading, empty, error, offline, success.
- Accessibility baseline is mandatory before release candidate.

## Release Gates (Must Pass)

- Gate A (Scope): No AI code, no AI content, no AI dependencies in production build.
- Gate B (Auth): OTP + password flows fully functional and secure.
- Gate C (Data): Persistent local storage with migration validated on real device.
- Gate D (SMS): Android SMS permission flow policy-ready with robust fallback UX.
- Gate E (CRUD): All entities pass CRUD matrix and validation tests.
- Gate F (UX): Dashboard quick actions + polished interface + accessibility baseline complete.
- Gate G (Android): Signed AAB passes internal testing and pre-launch checks.
- Gate H (Compliance): Privacy policy, data safety, and permission declarations approved.
- Gate I (Runtime Build): No Tailwind CDN/import-map runtime dependencies in production shell.
- Gate J (Environment): Dev/prod environments are separated and validated for frontend/backend.
- Gate K (Web Shell Hygiene): Favicon/icons resolve with no 404 metadata errors.

## Recommended Execution Sequence

1. Execute `T001` through `T017` for scope lock, AI purge, architecture baseline, and auth foundation.
2. Execute `T018` through `T035` for data model, categories, SMS pipeline, notifications, and CRUD correctness.
3. Execute `T036` through `T044` for complete UX/UI polish and required settings.
4. Execute `T045` through `T054` for Android build, testing, compliance, and release.
5. Execute `T055`, `T066`, `T067`, `T068`, `T069`, `T070`, and `T071` for runtime/build hygiene and strict dev/prod environment separation.
6. Execute `T056` through `T059` for hardening and maintainability.
7. Execute `T060` through `T065` for iOS launch.
