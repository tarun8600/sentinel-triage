# Frontend — Sentinel Triage dashboard

React (Vite) app. Planned views:

1. **Queue** — critical-first alert list with priority score, verdict chip, and one-line reasoning. Button: "Generate mock alerts".
2. **Alert detail** — full alert JSON, triage reasoning, Tavily enrichment with source links, "Add to incident" checkbox.
3. **Incidents** — correlated incident cards with the Nemotron-written brief and recommended actions.

## Setup

```bash
npm create vite@latest . -- --template react
npm install
npm run dev
```

API base: `http://localhost:8000` (see `backend/app/main.py`).

Key endpoints:
- `POST /alerts/ingest` with `{"generate_mock": 12}`
- `POST /alerts/{id}/triage` then `POST /alerts/{id}/enrich`
- `GET /queue` — the prioritized feed
- `POST /incidents/correlate` with `{"alert_ids": [...], "title": "..."}`
