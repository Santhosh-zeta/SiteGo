# Security Policy

## Reporting a vulnerability
Please **do not** open a public issue. Email **iamsanthosh2425@gmail.com** with
details and reproduction steps. You will get a response within a few days.

## Notes for deployers
- Never commit `.env` files; only `.env.example` templates belong in git.
- Use long random values for `JWT_SECRET` / `JWT_REFRESH_SECRET`
  (e.g. `openssl rand -hex 32`).
- Serve the API behind HTTPS in production.
