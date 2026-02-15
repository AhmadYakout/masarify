# Config Module

Current scope:
- Validate frontend runtime environment variables on startup.
- Provide a single source of truth for environment-aware settings.

Rules:
- `VITE_AUTH_API_BASE_URL` is required in all environments.
- `staging`/`production` modes cannot target localhost for auth API.
- `mock` mode can expose optional test login defaults:
  - `VITE_TEST_LOGIN_MOBILE`
  - `VITE_TEST_LOGIN_PASSWORD`
