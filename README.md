# EcoVision UAE 2026

EcoVision UAE 2026 is a production-style interactive climate resilience dashboard for competition demos and developer handoff. It combines a cinematic UAE map experience, resilient demo/live data ingestion, a Gemini-grounded AI assistant, and an audio briefing workflow that still works when no live services are available.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, MapLibre GL JS, Recharts
- Backend: Node.js, Express, TypeScript
- Shared layer: shared DTOs, demo dataset, schema inference, normalization helpers
- Data ingestion: CSV, JSON, Excel, MongoDB collection ingestion
- AI: Gemini through backend-only endpoints with deterministic fallback copy

## Project Structure

```text
ecovision/
  frontend/   React dashboard, map, chat, audio, and ingestion modal
  backend/    Express API, upload parsing, MongoDB ingestion, Gemini, PDF report
  shared/     Shared types, demo data, field aliases, normalization pipeline
```

## Setup

1. Install Node.js 20+ and npm.
2. From the `ecovision` folder, run `npm install`.
3. Copy `backend/.env.example` to `backend/.env`.
4. Copy `frontend/.env.example` to `frontend/.env`.
5. Add a `GEMINI_API_KEY` if you want live Gemini responses. If omitted, the assistant still works in demo-grounded fallback mode.
6. Start the full workspace with `npm run dev`.

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Features

- Always-on demo mode with UAE city mock data for Abu Dhabi, Dubai, Sharjah, Al Ain, and Fujairah
- Session-scoped live data ingestion from CSV, JSON, XLSX, and MongoDB
- Field inference plus manual mapping UI when source schemas differ
- MapLibre dashboard with dark and satellite baselayers, hotspot circles, hover details, and city selection
- KPI cards, SPI forecast chart, audio briefing engine, and bilingual AI climate assistant
- Backend PDF export for assistant responses and current city metrics

## API Endpoints

- `GET /api/health`
- `GET /api/dashboard/demo`
- `POST /api/data/upload`
- `POST /api/data/mongo/collections`
- `POST /api/data/mongo/ingest`
- `POST /api/chat`
- `POST /api/audio-brief`
- `POST /api/report/pdf`

## Notes

- If upload parsing or MongoDB ingestion fails, the backend returns demo data with warnings instead of leaving the UI empty.
- The frontend assumes a shared workspace install so `@ecovision/shared` is available in both the frontend and backend.
- Browser speech synthesis powers demo audio playback. No paid text-to-speech dependency is required for v1.
