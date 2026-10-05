# Frontend — Sentinel Triage dashboard

Vite + React 18 dashboard for the Sentinel Triage AI SOC analyst agent. Dark
SOC-console UI: critical-first triage queue, alert detail with Nemotron
reasoning and Tavily enrichment, and incident correlation.

## Prerequisites

- Node 18+
- The FastAPI backend running (default `http://localhost:8000`)

```bash
cd ../backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env   # add NEBIUS_API_KEY and TAVILY_API_KEY
uvicorn app.main:app --reload
```

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173, hit **Generate mock alerts**, then **Triage all**.

## Configuration

The backend base URL is configurable via `VITE_API_URL`:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

Default (unset): `http://localhost:8000`.

## Build

```bash
npm run build   # outputs to dist/
```

## Views

1. **Queue** (default) — "Generate mock alerts" ingests 12 mock alerts;
   "Triage all" scores every untriaged alert with Nemotron. Rows show score
   bar, verdict badge, severity badge, title, host/user, and reasoning
   snippet. Click a row for the detail panel. Checkboxes select alerts for
   incident correlation.
2. **Alert detail** — full alert fields, Nemotron triage (score, verdict,
   confidence, reasoning, recommended action), and an "Enrich with Tavily"
   button showing IOCs, intel summary, and source links.
3. **Incidents** — incident cards with the Nemotron-written brief,
   recommended actions, priority score, and correlated alert IDs.

A status pill in the header polls `GET /health` every 15 seconds.
