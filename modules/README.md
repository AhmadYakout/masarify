# Domain Modules

This folder is the baseline for feature-oriented architecture.

- `auth`: authentication and session domain.
- `categories`: category taxonomy and matching logic.
- `config`: runtime environment validation and configuration access.
- `notifications`: scheduling, templates, channel management, and preferences.
- `persistence`: SQLite-first local persistence, schema migration, and storage fallback handling.
- `settings`: account and application preferences.
- `sms`: SMS parsing and ingestion logic.
- `transactions`: transaction and bill domain logic.

UI components should consume these modules instead of embedding business rules.
