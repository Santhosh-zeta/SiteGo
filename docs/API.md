# SiteGo REST API

Base URL: `http://localhost:5000/api`. All routes except `/health`, `/` and
`/auth/google`, `/auth/refresh` require `Authorization: Bearer <accessToken>`.
Responses follow `{ "success": boolean, "message": string, "data": ... }`.
Role access (worker / supervisor / manager / admin) is enforced by RBAC
middleware; see each `src/routes/*.routes.js` for the exact `@access` rules.

| Area | Method & path | Purpose |
|---|---|---|
| Auth | `POST /auth/google` | Exchange a Google `id_token` for access + refresh tokens |
| | `POST /auth/refresh` | Issue a new access token |
| | `POST /auth/logout` · `GET /auth/me` · `POST /auth/verify` | Session helpers |
| Users | `GET /users` · `GET /users/stats` · `GET /users/role/:role` | List / stats |
| | `POST /users` · `GET/PUT/DELETE /users/:userId` | CRUD |
| | `PUT /users/:userId/role` · `PUT /users/:userId/status` | Role & status |
| Sites | `POST /sites` · `GET /sites` · `GET /sites/my` | Create / list |
| | `GET/PUT/DELETE /sites/:siteId` | Manage a site (with geofence polygon) |
| | `POST /sites/:siteId/users` · `DELETE /sites/:siteId/users/:userId` | Assign workers |
| Attendance | `POST /attendance/check-in` · `/check-out` | Geofence-validated |
| | `GET /attendance/today` · `/history` · `/site/:siteId` | Records |
| Materials | `POST/GET /materials/master` · `GET /materials/categories` | Catalogue |
| | `POST /materials/scan` | Log received/used material by QR |
| | `GET /materials/inventory/:siteId` · `/logs/:siteId` | Stock & history |
| Reports | `POST /reports/daily` · `PUT /reports/daily/:reportId` | Daily reports |
| | `GET /reports/site/:siteId` · `/my` | Listing |
| | `POST /reports/:reportId/approve` · `/reject` | Review |
| Issues | `POST /issues` · `GET /issues/my` · `/site/:siteId` · `/:issueId` | Track issues |
| | `PUT /issues/:issueId/status` · `/assign` · `POST /issues/:issueId/comments` | Workflow |
| AI | `POST /ai/analyze` | Image quality check (defect classification) |
| | `GET /ai/quality-checks/:siteId` · `/stats/:siteId` · `/model-info` | Results |
| Meta | `GET /health` | Liveness probe |
