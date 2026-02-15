# Transactions Module

Current scope:
- Async repository abstraction over shared persistence (`SQLite` on native, `localStorage` fallback).
- Transaction and recurring-bill persistence for load/save flows.
- Domain service helpers for:
  - manual transaction construction + taxonomy validation integration
  - recurring bill operations (add/toggle/delete)
  - transaction-level cleanup helpers (detach tag/person links)
  - aggregate calculations (balance)

Planned next scope:
- Complete transaction CRUD matrix coverage (edit/delete/filter).
- Entity-level guardrails for destructive actions and undo paths.
