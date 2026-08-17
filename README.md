# Abbasid TimeMap

Abbasid TimeMap is an interactive platform for exploring Abbasid history through time and geography. This foundation phase establishes the frontend and API only; historical records, the map, timeline, and AI features are intentionally deferred to later milestones.

## Repository structure

```text
AbbasidTimeMap/
├── frontend/  # Next.js + TypeScript application
├── backend/   # FastAPI application
├── data/      # Future curated historical data assets
└── docs/      # Product, architecture, and delivery documentation
```

## Requirements

- Node.js 20.9 or newer and npm
- Python 3.11 or newer
- PostgreSQL with PostGIS (not required to run F-01; configured for later phases)

## Local ports

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API health: `http://localhost:8000/api/v1/health`

## Run the backend

```powershell
cd backend
Copy-Item .env.example .env
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

The compatibility endpoint `GET /health` and the versioned endpoint `GET /api/v1/health` both return a small healthy JSON response.

## Run the frontend

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

The frontend uses `NEXT_PUBLIC_API_BASE_URL` to request the backend health endpoint. Its local default is `http://localhost:8000/api/v1`.

## Verification

```powershell
cd frontend
npm run lint
npm run build

cd ..\backend
.\.venv\Scripts\python.exe -m pytest
```
