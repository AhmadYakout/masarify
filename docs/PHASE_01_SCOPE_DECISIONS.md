# Phase 01 Scope Decisions (Locked Baseline)

## Date
February 13, 2026

## Purpose
Lock the initial product and compliance baseline so implementation can proceed in dependency order.

## T001: Android v1 Scope (AI-Free)
- v1 excludes all AI features.
- v1 excludes AI copy, AI prompts, and AI-backed categorization.
- v1 keeps manual transaction entry and SMS-based parsing flows.
- v1 keeps bills and analytics modules already in the app.

## T002: SMS Strategy by Platform
- Android: support automatic detection from SMS inbox plus payment-related notification listener (permission-gated).
- iOS: no inbox-reading; support manual paste/import flow only.
- Both platforms: transaction capture must still work when permission is denied.
- Detected payment candidates must be confirmed by user before transaction creation.
- Candidate confirmations must be surfaced through both push/local notifications and in-app notifications.

## T003: Auth Baseline
- Registration flow: mobile number -> OTP verification -> create password -> confirm password.
- Login flow: mobile number + password.
- Reset flow: forgot password -> OTP verification -> set new password.

## T004: Compliance Baseline
- Privacy policy must explicitly describe SMS access scope and data handling.
- Data safety declarations must match runtime behavior.
- Permission request UX must include clear in-app rationale before system prompt.
- SMS data handling baseline:
  - No debug logging of full SMS content in production.
  - Minimize retention and store only required parsed transaction fields.
