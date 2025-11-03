# Baller Up

Full-stack app to track who’s next to play on a basketball court.

## Tech

- Frontend: React (Vite)
- Backend: Node.js + Express + SQLite (file: `backend/data.db`)

## Quick Start

1. Install dependencies (root creates only dev convenience):

    ```bash
    npm install
    cd backend && npm install
    cd ../frontend && npm install
    ```

2. Run both servers (from repo root):

    ```bash
    npm run dev
    ```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## API

- GET `/api/queue` → `{ queue: string[] }`
- POST `/api/join` body `{ name: string }` → `{ queue }`
- POST `/api/leave` body `{ name: string }` → `{ queue }`
- POST `/api/next` → `{ next: string|null, queue }`

## Config

- Backend CORS origin: `CORS_ORIGIN` (defaults to `http://localhost:5173`)
- Backend port: `PORT` (defaults to `4000`)
- Frontend API URL: `VITE_API_URL` (defaults to `http://localhost:4000`)
- DB file path: `DB_FILE` (defaults to `backend/data.db`)

## Notes

- Queue persists in SQLite; deleting `backend/data.db` resets it.

## Authors

- [Daniel Ribeirinha-Braga](https://github.com/DBragz)
- [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)