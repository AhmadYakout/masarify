# Persistence Module

Shared app persistence layer with:
- Native runtime: SQLite-backed storage with schema versioning/migrations.
- Web/runtime fallback: localStorage.
- Legacy compatibility: lazy one-time backfill from localStorage into SQLite per key.

This module is intentionally key-value oriented for v1 to avoid overengineering while still
meeting durable mobile storage requirements.
