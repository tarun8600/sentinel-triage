"""Pydantic schemas for alerts, triage results, and incidents."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Alert(BaseModel):
    """A single normalized security alert (Splunk / CrowdStrike-shaped)."""

    id: str
    source: Literal["splunk", "crowdstrike", "mock"] = "mock"
    title: str
    description: str = ""
    severity: Literal["critical", "high", "medium", "low", "informational"] = "medium"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    host: str = ""
    user: str = ""
    process: str = ""
    src_ip: str = ""
    dest_ip: str = ""
    domain: str = ""
    file_hash: str = ""
    raw: dict = Field(default_factory=dict)


class TriageResult(BaseModel):
    """Nemotron's triage verdict for one alert."""

    alert_id: str
    priority_score: float = Field(ge=0, le=100, description="0-100, higher = investigate first")
    verdict: Literal["true_positive", "likely_true_positive", "likely_false_positive", "false_positive", "needs_review"]
    confidence: float = Field(ge=0, le=1)
    reasoning: str = ""
    recommended_action: str = ""
    model: str = ""


class Enrichment(BaseModel):
    """Tavily threat-intel context for IOCs in an alert."""

    alert_id: str
    iocs: list[str] = Field(default_factory=list)
    summary: str = ""
    sources: list[str] = Field(default_factory=list)


class Incident(BaseModel):
    """A correlated group of alerts with an analyst-ready brief."""

    id: str
    title: str
    alert_ids: list[str] = Field(default_factory=list)
    priority_score: float = 0
    brief: str = ""
    recommended_actions: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
