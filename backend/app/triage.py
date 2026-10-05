"""Nemotron triage via Nebius Token Factory (OpenAI-compatible API).

Model routing:
- Fast/small Nemotron model  -> per-alert scoring (latency matters, many calls)
- Larger Nemotron model      -> incident summarization (reasoning depth matters)
"""
from __future__ import annotations

import os

import httpx

from .models import Alert, TriageResult

TOKEN_FACTORY_URL = os.getenv(
    "NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1"
)
FAST_MODEL = os.getenv("NEMOTRON_FAST_MODEL", "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B")
REASONING_MODEL = os.getenv("NEMOTRON_REASONING_MODEL", "nvidia/Nemotron-3-Ultra-550b-a55b")

TRIAGE_SYSTEM_PROMPT = """You are a Tier-2 SOC analyst triaging security alerts.
Score each alert 0-100 for investigation priority and give a verdict:
true_positive, likely_true_positive, likely_false_positive, false_positive, or needs_review.
Consider: asset criticality, alert fidelity, known benign patterns, and blast radius.
Respond in JSON: {"priority_score": <0-100>, "verdict": "<...>", "confidence": <0-1>,
"reasoning": "<1-2 sentences>", "recommended_action": "<one concrete next step>"}."""


async def _chat(model: str, system: str, user: str) -> str:
    api_key = os.getenv("NEBIUS_API_KEY", "")
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{TOKEN_FACTORY_URL}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.2,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def triage_alert(alert: Alert) -> TriageResult:
    """Score a single alert with the fast Nemotron model."""
    import json

    user_msg = (
        f"Title: {alert.title}\nSeverity: {alert.severity}\nSource: {alert.source}\n"
        f"Host: {alert.host}\nUser: {alert.user}\nProcess: {alert.process}\n"
        f"Src IP: {alert.src_ip}\nDest IP: {alert.dest_ip}\nDomain: {alert.domain}\n"
        f"File hash: {alert.file_hash}\nDescription: {alert.description}"
    )
    raw = await _chat(FAST_MODEL, TRIAGE_SYSTEM_PROMPT, user_msg)
    try:
        data = json.loads(raw[raw.index("{"): raw.rindex("}") + 1])
    except (ValueError, json.JSONDecodeError):
        data = {
            "priority_score": 50,
            "verdict": "needs_review",
            "confidence": 0.3,
            "reasoning": "Model output was not valid JSON; manual review advised.",
            "recommended_action": "Review alert manually.",
        }
    return TriageResult(
        alert_id=alert.id,
        priority_score=float(data.get("priority_score", 50)),
        verdict=data.get("verdict", "needs_review"),
        confidence=float(data.get("confidence", 0.5)),
        reasoning=data.get("reasoning", ""),
        recommended_action=data.get("recommended_action", ""),
        model=FAST_MODEL,
    )


async def summarize_incident(alert_titles: list[str], triage_notes: list[str]) -> str:
    """Write an analyst-ready incident brief with the reasoning model."""
    system = (
        "You are a senior SOC analyst. Given triaged alerts, write a concise incident brief: "
        "what happened, why it matters, and the top 3 recommended actions. Keep it under 200 words."
    )
    user = "\n".join(f"- {t}: {n}" for t, n in zip(alert_titles, triage_notes))
    return await _chat(REASONING_MODEL, system, user)
