# Architecture — Sentinel Triage

## Data flow

```
mock_alerts / pasted JSON
        │  POST /alerts/ingest
        ▼
     [Alert store]
        │  POST /alerts/{id}/triage
        ▼
 Nemotron (fast model) ──► TriageResult (score, verdict, reasoning)
        │  POST /alerts/{id}/enrich
        ▼
 Tavily IOC lookup ──► Enrichment (intel summary + sources)
        │  GET /queue
        ▼
 React dashboard (critical-first queue)
        │  POST /incidents/correlate
        ▼
 Nemotron (reasoning model) ──► Incident brief
```

## Model routing (why two models)

| Stage | Model | Why |
|---|---|---|
| Per-alert triage | Small/fast Nemotron (Nano-class) | Many calls, latency-sensitive; scoring is a narrow task |
| Incident brief | Larger Nemotron (Ultra-class) | Few calls, needs real reasoning over correlated alerts |

Both are called through **Nebius Token Factory** (OpenAI-compatible `/chat/completions`), so swapping models is a config change, not a code change.

## Alert schema

`Alert` normalizes Splunk- and CrowdStrike-shaped detections into one shape (see `models.py`): ids, severity, host/user/process, network IOCs, file hash, plus the raw payload. Judges can paste real JSON or hit "Generate mock alerts" for a zero-setup demo.

## Correlation (v1)

Manual selection in the dashboard → `POST /incidents/correlate`. v2 idea: auto-correlate by shared IOCs (same IP/domain/host within a time window) before the LLM brief.

## What the demo shows

1. Generate 12 mock alerts → queue populates with priority scores and verdicts
2. Open a critical alert → Tavily enrichment with sources
3. Correlate the top alerts → incident brief with recommended actions

## Non-goals for the hackathon build

- Real SIEM connectors (Splunk HEC / CrowdStrike Fusion) — schema is ready, connectors are post-hackathon
- Auth / multi-tenancy
- Persistent DB (in-memory store is fine for the demo)
