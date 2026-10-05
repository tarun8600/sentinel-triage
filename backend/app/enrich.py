"""Tavily threat-intel enrichment for IOCs found in alerts."""
from __future__ import annotations

import os

from .models import Alert, Enrichment

try:
    from tavily import TavilyClient
except ImportError:  # pragma: no cover - optional until API key is set
    TavilyClient = None


def extract_iocs(alert: Alert) -> list[str]:
    iocs: list[str] = []
    for value in (alert.src_ip, alert.dest_ip, alert.domain, alert.file_hash):
        if value and value not in iocs:
            iocs.append(value)
    return iocs


def enrich_alert(alert: Alert, max_results: int = 3) -> Enrichment:
    """Look up each IOC with Tavily; degrade gracefully without an API key."""
    iocs = extract_iocs(alert)
    api_key = os.getenv("TAVILY_API_KEY", "")
    if not iocs or not api_key or TavilyClient is None:
        return Enrichment(
            alert_id=alert.id,
            iocs=iocs,
            summary="Enrichment skipped (no Tavily API key configured).",
        )
    client = TavilyClient(api_key=api_key)
    summaries: list[str] = []
    sources: list[str] = []
    for ioc in iocs:
        try:
            res = client.search(
                query=f"threat intelligence {ioc} malware malicious",
                search_depth="advanced",
                max_results=max_results,
            )
            for r in res.get("results", []):
                summaries.append(f"{ioc}: {r.get('title', '')} — {r.get('content', '')[:200]}")
                if r.get("url"):
                    sources.append(r["url"])
        except Exception as exc:  # keep triage working even if intel fails
            summaries.append(f"{ioc}: lookup failed ({exc})")
    return Enrichment(
        alert_id=alert.id,
        iocs=iocs,
        summary="\n".join(summaries) or "No threat-intel hits.",
        sources=sources,
    )
