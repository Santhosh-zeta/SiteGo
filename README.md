<div align="center">

# 🏗️ SiteGo

**Construction site monitoring & management — attendance, materials, reports, issues and AI quality checks in one app.**

![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=black)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-AI-FF6F00?logo=tensorflow&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

<img src="docs/screenshots/login.png" width="220" alt="Login"/>
<img src="docs/screenshots/admin-users.png" width="220" alt="Admin users"/>
<img src="docs/screenshots/admin-sites.png" width="220" alt="Admin sites"/>

</div>

---

## ✨ Features

| | |
|---|---|
| 🔐 **Google sign-in + JWT** | OAuth login, short-lived access tokens, refresh tokens |
| 👥 **Role-based access** | `worker`, `supervisor`, `manager`, `admin`, each with their own app experience |
| 📍 **Geofenced attendance** | Check-in / check-out validated against a site polygon |
| 🧱 **Material tracking** | Material master, QR-based scan logging, per-site inventory |
| 📝 **Daily reports** | Submit, review, approve or reject |
| ⚠️ **Issue tracking** | Create, assign, comment and move issues through a workflow |
| 🤖 **AI quality checks** | TensorFlow.js image classifier (cracks, misalignment, plastering, missing safety gear…) |
| 🐳 **One-command deploy** | Docker Compose for DB + API + web app, plus GitHub Actions CI |

## 🧭 Architecture

```mermaid
flowchart LR
    subgraph Client["Expo / React Native app (iOS · Android · Web)"]
        UI[Role-based screens] --> RX[Auth context + Axios client]
    end
    RX -- "HTTPS / JSON + JWT" --> API
    subgraph Server["Node.js · Express API"]
        API[Routes] --> MW[Auth + RBAC middleware]
        MW --> CT[Controllers]
        CT --> SV[Services: geofence · AI · S3]
    end
    CT --> DB[(PostgreSQL)]
    SV --> TF[[TensorFlow.js model]]
    SV --> S3[(AWS S3 files)]
    RX -. "id_token" .-> G[Google OAuth]
    API -. "verify" .-> G
```

## 👤 Roles

```mermaid
flowchart TD
    A[Admin<br/>users · sites · materials master] --> M[Manager<br/>progress · inventory · documents]
    M --> S[Supervisor<br/>site overview · material scan · issues · reports]
    S --> W[Worker<br/>attendance · tasks]
```

## 🔑 Sign-in flow

```mermaid
sequenceDiagram
    actor U as User
    participant App
    participant Google
    participant API
    participant DB as PostgreSQL
    U->>App: Continue with Google
    App->>Google: OAuth request
    Google-->>App: id_token
    App->>API: POST /api/auth/google
    API->>Google: Verify id_token
    API->>DB: Find or create user
    API-->>App: accessToken + refreshToken + user
    App->>API: Authenticated requests (Bearer token)
    API-->>App: 401 → refresh → retry
```

## 📍 Geofenced attendance

```mermaid
flowchart LR
    A[Worker taps Check-in] --> B[Send GPS location]
    B --> C{Inside site polygon?}
    C -- Yes --> D[Record attendance] --> E[Success]
    C -- No --> F[Reject: outside site]
```

## 🗄️ Data model

```mermaid
erDiagram
    USERS ||--o{ SITE_USERS : "assigned to"
    SITES ||--o{ SITE_USERS : has
    SITES ||--o{ ATTENDANCE : records
    USERS ||--o{ ATTENDANCE : logs
    SITES ||--o{ MATERIAL_INVENTORY : stocks
    MATERIAL_MASTER ||--o{ MATERIAL_INVENTORY : defines
    MATERIAL_MASTER ||--o{ MATERIAL_LOGS : tracked_in
    SITES ||--o{ DAILY_REPORTS : has
    SITES ||--o{ ISSUES : has
    ISSUES ||--o{ ISSUE_COMMENTS : has
    SITES ||--o{ TASKS : has
    SITES ||--o{ DOCUMENTS : stores
    SITES ||--o{ QUALITY_CHECKS : analysed_by_AI
```

## 📸 Screenshots

Captured from the web build running against the real API and a seeded database.

| Login | Admin · Dashboard | Admin · Users |
|:---:|:---:|:---:|
| <img src="docs/screenshots/login.png" width="230"/> | <img src="docs/screenshots/admin-dashboard.png" width="230"/> | <img src="docs/screenshots/admin-users.png" width="230"/> |

| Admin · Sites | Admin · Materials | Supervisor · Overview |
|:---:|:---:|:---:|
| <img src="docs/screenshots/admin-sites.png" width="230"/> | <img src="docs/screenshots/admin-materials.png" width="230"/> | <img src="docs/screenshots/supervisor-dashboard.png" width="230"/> |

| Supervisor · Material scan | Worker · Home | Worker · Attendance |
|:---:|:---:|:---:|
| <img src="docs/screenshots/supervisor-materials.png" width="230"/> | <img src="docs/screenshots/worker-home.png" width="230"/> | <img src="docs/screenshots/worker-attendance.png" width="230"/> |

## 🚀 Getting started

### Option A — Docker (fastest)

```bash
git clone https://github.com/Santhosh-zeta/SiteGo.git && cd SiteGo
export JWT_SECRET=$(openssl rand -hex 32) JWT_REFRESH_SECRET=$(openssl rand -hex 32)
export GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com   # optional for API-only use
docker compose up --build
```

- Web app → http://localhost:8080
- API → http://localhost:5000/api (health: `/api/health`)

### Option B — Local development

**Prerequisites:** Node.js 20+, PostgreSQL 14+.

```bash
# 1. Backend
cd backend
cp .env.example .env          # fill in DB credentials, JWT secrets, Google client ID
npm install
npm run migrate               # creates the schema (safe to re-run)
npm run seed                  # optional demo users + sites
npm run dev                   # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install --legacy-peer-deps
npm run web                   # or: npm run android / npm run ios
```

### Configuration

| Variable | Where | Description |
|---|---|---|
| `DB_*` | backend | PostgreSQL connection |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | backend | Token signing keys — use long random values |
| `GOOGLE_CLIENT_ID` | backend | Audience for verifying Google ID tokens |
| `AI_MODEL_ENABLED` | backend | `false` uses mock predictions (no model required) |
| `AWS_*` | backend | Optional S3 storage for uploads |
| `EXPO_PUBLIC_API_URL` | frontend | API base URL |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | frontend | Google OAuth client ID |

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

## 🔌 API

52 REST endpoints across auth, users, sites, attendance, materials, reports, issues and AI. Full reference: **[docs/API.md](docs/API.md)**.

## 🤖 AI quality model

The backend loads a TensorFlow.js model from `backend/ai_models/quality_check_model`. Training and conversion scripts live in [`backend/ai_models`](backend/ai_models) (`train_model.py`, `convert_to_tfjs.py`). Without a model the service falls back to mock predictions, so the app runs out of the box.

## 🗂️ Project structure

```
SiteGo/
├── backend/            Express API
│   ├── database/       SQL migrations, migrate + seed scripts
│   ├── ai_models/      Training / conversion scripts
│   └── src/            routes · controllers · middleware · services · utils
├── frontend/           Expo (React Native + Web) app
│   └── src/            screens · navigation · services · contexts
├── docs/               API reference, screenshots
├── docker-compose.yml  DB + API + web
└── .github/workflows/  CI
```

## 🛣️ Status & roadmap

SiteGo is an actively evolving project. The backend API, auth, migrations, admin console, material scanning and attendance flows work today. Still to build:

- [ ] Manager screens: progress charts, timeline, inventory, documents (currently placeholders)
- [ ] Worker tasks API and screen wiring
- [ ] Real GPS in the attendance screen (currently a fixed test location)
- [ ] Automated tests and linting
- [ ] Trained quality-check model shipped with the repo

## 🤝 Contributing & security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## 📄 License

[MIT](LICENSE) © Santhosh-zeta
