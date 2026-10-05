# Sentinel Triage — AI SOC Analyst Agent

An AI agent that does a Tier-1 SOC analyst's most painful job: turning an alert flood into a prioritized, explainable incident queue.

Built for the **Nebius × NVIDIA Global AI Hackathon** (Best Apps & Agents track).

## What it does

1. **Ingest** — paste security alerts or generate realistic mock ones (Splunk / CrowdStrike-format JSON)
2. **Triage** — NVIDIA Nemotron models score every alert (severity, confidence, priority) and correlate related alerts into incidents
3. **Enrich** — Tavily threat-intel lookup on IOCs (IPs, domains, hashes, CVEs)
4. **Summarize** — incident brief with recommended next actions, written for an analyst
5. **Queue** — React dashboard showing a critical-first prioritized incident queue, with reasoning visible

## Stack

- **Frontend:** React (Vite) dashboard
- **Backend:** Python / FastAPI
- **Models:** NVIDIA Nemotron via Nebius Token Factory
  - Fast model (e.g. Nemotron Nano/Super) for per-alert scoring
  - Larger model for incident summarization and reasoning
- **Threat intel:** Tavily API

## Quickstart

```bash
# backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add NEBIUS_API_KEY and TAVILY_API_KEY
uvicorn app.main:app --reload

# frontend
cd frontend   # React dashboard — in progress
npm install
npm run dev
```

Then open http://localhost:5173, hit "Generate mock alerts," and watch the triage queue populate.

## How Nemotron / Token Factory is used

- All LLM calls go through Nebius Token Factory (OpenAI-compatible endpoint).
- Per-alert triage uses a small, fast Nemotron model for latency; incident summarization routes to a larger Nemotron model for reasoning depth. See `docs/ARCHITECTURE.md`.

## Project structure

```
backend/app/
  main.py        # FastAPI app + routes
  models.py      # Pydantic schemas (Alert, Incident, TriageResult)
  triage.py      # Nemotron scoring via Token Factory
  enrich.py      # Tavily IOC enrichment
  mock_alerts.py # realistic mock alert generator (zero-setup demo)
frontend/src/    # React dashboard (alert queue + incident detail)
docs/            # architecture notes
```

## Submission checklist

- [x] Runs on Nebius Token Factory + NVIDIA open model
- [ ] Public repo with OSS license (MIT)
- [ ] Live demo URL
- [ ] ≤3-min YouTube demo video
- [ ] Setup instructions + Nemotron/Token Factory explanation (this README)

## License

MIT — see [LICENSE](LICENSE).
