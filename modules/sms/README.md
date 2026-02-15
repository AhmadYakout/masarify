# SMS Module

Current scope:
- Parse Egyptian financial SMS into transaction candidates.
- Detect and categorize payment candidates from raw messages.
- Persist candidate queue state.
- Candidate workflow helpers for queue/confirm/dismiss lifecycle transitions.
- Event-based ingestion entrypoint for future native SMS/notification listeners.
- Native bridge entrypoint via `window.masarifyNativePaymentMessage(rawMessage, source)`.
- Permission bridge for Android SMS/notification/listener status + request actions.

Planned next scope:
- Provider-specific parsing templates and confidence scoring.
- Policy-grade permission rationale flows and denial telemetry.
