"""Sentinel Triage API — alert ingestion, triage, enrichment, incidents."""
from __future__ import annotations

import uuid
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .enrich import enrich_alert
from .mock_alerts import generate_mock_alerts
from .models import Alert, Enrichment, Incident, TriageResult
from .triage import summarize_incident, triage_alert

app = FastAPI(title="Sentinel Triage", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store (demo). Swap for a DB later.
ALERTS: dict[str, Alert] = {}
TRIAGE: dict[str, TriageResult] = {}
ENRICHMENTS: dict[str, Enrichment] = {}
INCIDENTS: dict[str, Incident] = {}


class IngestRequest(BaseModel):
    alerts: list[Alert] = []
    generate_mock: int = 0


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/alerts/ingest")
def ingest(req: IngestRequest) -> dict:
    alerts = list(req.alerts)
    if req.generate_mock:
        alerts.extend(generate_mock_alerts(count=req.generate_mock))
    for a in alerts:
        ALERTS[a.id] = a
    return {"ingested": len(alerts), "ids": [a.id for a in alerts]}


@app.get("/alerts")
def list_alerts() -> list[Alert]:
    return sorted(ALERTS.values(), key=lambda a: a.timestamp, reverse=True)


@app.post("/alerts/{alert_id}/triage", response_model=TriageResult)
async def triage_one(alert_id: str) -> TriageResult:
    alert = ALERTS.get(alert_id)
    if not alert:
        raise HTTPException(404, "alert not found")
    result = await triage_alert(alert)
    TRIAGE[alert_id] = result
    return result


@app.post("/alerts/{alert_id}/enrich", response_model=Enrichment)
def enrich_one(alert_id: str) -> Enrichment:
    alert = ALERTS.get(alert_id)
    if not alert:
        raise HTTPException(404, "alert not found")
    enrichment = enrich_alert(alert)
    ENRICHMENTS[alert_id] = enrichment
    return enrichment


@app.get("/queue")
def queue() -> list[dict]:
    """Prioritized triage queue — highest priority score first."""
    items = []
    for alert_id, result in TRIAGE.items():
        alert = ALERTS.get(alert_id)
        items.append(
            {
                "alert": alert,
                "triage": result,
                "enrichment": ENRICHMENTS.get(alert_id),
            }
        )
    return sorted(items, key=lambda i: i["triage"].priority_score, reverse=True)


class CorrelateRequest(BaseModel):
    alert_ids: list[str]
    title: str = "Correlated incident"


@app.post("/incidents/correlate", response_model=Incident)
async def correlate(req: CorrelateRequest) -> Incident:
    alerts = [ALERTS[i] for i in req.alert_ids if i in ALERTS]
    if not alerts:
        raise HTTPException(404, "no matching alerts")
    notes = [TRIAGE.get(a.id).reasoning if TRIAGE.get(a.id) else "" for a in alerts]
    brief = await summarize_incident([a.title for a in alerts], notes)
    scores = [TRIAGE[a.id].priority_score for a in alerts if a.id in TRIAGE]
    incident = Incident(
        id=f"inc-{uuid.uuid4().hex[:8]}",
        title=req.title,
        alert_ids=[a.id for a in alerts],
        priority_score=max(scores) if scores else 0,
        brief=brief,
        recommended_actions=[
            t.recommended_action for a in alerts
            if (t := TRIAGE.get(a.id)) and t.recommended_action
        ][:3],
    )
    INCIDENTS[incident.id] = incident
    return incident


@app.get("/incidents")
def list_incidents() -> list[Incident]:
    return sorted(INCIDENTS.values(), key=lambda i: i.priority_score, reverse=True)
