# DailyRoutine — Habit Tracker & Journal

A personal productivity app for daily journaling, habit tracking, streak management, and AI-powered accountability. Built for the AI Protosprint Hackathon — Track 2.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | FastAPI (Python), Uvicorn |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (python-jose + bcrypt) |
| AI | Emergent AI (GPT-4o vision, GPT-4.5, Claude) |

---

## Architecture Overview

```
frontend/          React SPA (port 3000)
│
├── src/pages/     One file per route (Dashboard, Habits, Journal, Stats...)
├── src/components/ Reusable UI (Layout, AccountabilityModal, ProofUploadModal...)
└── src/contexts/  AuthContext — global auth state via JWT in localStorage

backend/           FastAPI app (port 8001)
│
├── server.py      All API routes (~1500 lines, sectioned by feature)
├── models.py      Pydantic schemas for core collections
├── models_extended.py  Schemas for social, accountability, proof features
├── auth.py        JWT creation and verification
├── streak_calculator.py  Current + longest streak logic
├── ai_service.py  LLM calls (journal analysis, coaching, chat)
├── proof_verifier.py    Vision-based habit proof verification
└── agents/
    ├── auditor_agent.py     Scans for broken streaks
    ├── enforcer_agent.py    Generates personalised accountability messages
    └── agent_orchestrator.py  Coordinates auditor → enforcer pipeline

scripts/
└── seed.py        Populates DB with demo user + 14 days of data
```

**MongoDB collections:** `users`, `habits`, `completions`, `journal_entries`, `accountability_messages`, `agent_logs`, `friends`, `shared_habits`, `notification_preferences`, `habit_templates`, `habit_categories`

---

## Prerequisites

Make sure these are installed on your machine before starting:

- **Python 3.10+** — `python --version`
- **Node.js 18+** — `node --version`
- **Yarn** — `npm install -g yarn`
- **MongoDB** — running locally on default port 27017

To start MongoDB locally:
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=habit_tracker
EMERGENT_LLM_KEY=your_emergent_api_key_here
CORS_ORIGINS=*
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
uvicorn server:app --reload --port 8001
```

Verify it's running by visiting: `http://localhost:8001/docs`

### 3. Frontend setup

```bash
cd frontend
yarn install
```

Create a `.env` file inside the `frontend/` folder:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

Start the frontend:

```bash
yarn start
```

App will open at: `http://localhost:3000`

### 4. Seed the database

In a new terminal:

```bash
cd scripts
python seed.py
```

Expected output:
```
✅ Created user: demo@dailyroutine.com
✅ Created 5 habits
✅ Created 57 habit completions
✅ Created 14 journal entries
🎉 Database seeded successfully
```

---

## Environment Variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | ✅ | MongoDB connection string. Use `mongodb://localhost:27017` for local. |
| `DB_NAME` | ✅ | Database name. Use `habit_tracker`. |
| `EMERGENT_LLM_KEY` | ✅ for AI features | API key for Emergent AI (powers all AI/vision features). |
| `CORS_ORIGINS` | ✅ | Allowed frontend origins. Use `*` for local dev. |
| `FRONTEND_URL` | Optional | Used in password reset email links. |

### `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_BACKEND_URL` | ✅ | Backend base URL. Use `http://localhost:8001` for local. Leave empty when running inside Emergent's preview environment. |

---

## Demo Account

After seeding, log in with:

```
Email:    demo@dailyroutine.com
Password: Demo@1234
```

This account comes pre-loaded with 5 habits, 14 days of journal entries, and realistic completion history to demonstrate streaks and history views.

---

## Key Features

- **Journaling** — daily entries with mood tracking, timestamped and editable
- **Habit Management** — create habits with emoji and colour, track daily completions
- **Streak Logic** — current and longest streak calculated per habit
- **History/Calendar View** — see past completions and journal entries by date
- **Mood Ring (AI)** — auto-analyses journal entries for sentiment and themes
- **Accountability Coach (AI)** — two-agent system that detects broken streaks and generates personalised motivational messages using your journal history
- **Proof of Work (AI Vision)** — submit photo proof for habits; GPT-4o vision verifies the image and rejects fakes with sarcastic comments

---

## API Overview

All endpoints are prefixed with `/api` and require a `Bearer` token (except auth routes).

| Category | Endpoints |
|---|---|
| Auth | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` |
| Habits | `GET/POST /api/habits`, `PUT/DELETE /api/habits/{id}`, `PATCH /api/habits/{id}/require-proof` |
| Completions | `GET /api/completions/today`, `POST /api/completions`, `DELETE /api/completions/{id}/today` |
| Journal | `GET/POST /api/journal`, `PUT/DELETE /api/journal/{id}` |
| Stats | `GET /api/stats/streaks`, `GET /api/stats/summary`, `GET /api/stats/calendar/{year}/{month}` |
| Accountability | `POST /api/accountability/check`, `GET /api/accountability/messages` |
| Proof of Work | `POST /api/proof/submit`, `GET /api/proof/pending`, `PATCH /api/habits/{id}/require-proof` |

Full interactive docs available at `http://localhost:8001/docs` when the backend is running.
