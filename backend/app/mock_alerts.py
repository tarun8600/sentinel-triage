"""Realistic mock alert generator — zero-setup demo data.

Produces Splunk/CrowdStrike-shaped alerts spanning true positives,
benign noise, and edge cases so the triage queue demo feels real.
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta

from .models import Alert

_TEMPLATES = [
    # (title, description, severity, source, host, user, process, src_ip, dest_ip, domain, file_hash)
    (
        "Suspicious PowerShell encoded command",
        "powershell.exe launched with -EncodedCommand on workstation; matches living-off-the-land pattern.",
        "high", "crowdstrike", "WS-FIN-014", "j.chen", "powershell.exe",
        "10.4.2.31", "20.185.12.9", "", "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
    ),
    (
        "Multiple failed logons followed by success",
        "12 failed logons for svc-backup in 4 minutes, then a successful logon from a new IP.",
        "high", "splunk", "SRV-AD-02", "svc-backup", "lsass.exe",
        "10.4.2.88", "", "", "",
    ),
    (
        "Known malicious domain in DNS logs",
        "Workstation resolved a domain flagged in threat feeds; possible C2 beaconing.",
        "critical", "splunk", "WS-HR-007", "a.patel", "chrome.exe",
        "10.4.5.12", "45.155.204.11", "malicious-c2-example.net", "",
    ),
    (
        "Windows Defender signature update",
        "Routine antimalware platform update completed successfully.",
        "informational", "crowdstrike", "WS-ENG-022", "system", "MsMpEng.exe",
        "", "", "", "",
    ),
    (
        "USB mass storage device connected",
        "Removable media inserted on a workstation in a restricted zone.",
        "medium", "crowdstrike", "WS-OPS-003", "m.garcia", "explorer.exe",
        "10.4.7.44", "", "", "",
    ),
    (
        "Impossible travel logon",
        "User authenticated from two countries 40 minutes apart.",
        "high", "splunk", "cloud", "s.okafor", "",
        "10.4.9.2", "91.203.67.114", "", "",
    ),
    (
        "Scheduled backup job started",
        "Nightly Veeam backup job initiated on schedule.",
        "low", "splunk", "SRV-BKP-01", "svc-backup", "veeam.exe",
        "", "", "", "",
    ),
    (
        "Ransomware-like file renaming burst",
        "400+ files renamed with unknown extension in 90 seconds on a file share.",
        "critical", "crowdstrike", "FS-ACCT-01", "r.smith", "unknown.exe",
        "10.4.3.19", "", "", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ),
]


def generate_mock_alerts(count: int = 12, seed: int | None = None) -> list[Alert]:
    rng = random.Random(seed)
    now = datetime.utcnow()
    alerts: list[Alert] = []
    for i in range(count):
        t = rng.choice(_TEMPLATES)
        alerts.append(
            Alert(
                id=f"alert-{uuid.uuid4().hex[:8]}",
                source=t[3],  # type: ignore[arg-type]
                title=t[0],
                description=t[1],
                severity=t[2],  # type: ignore[arg-type]
                timestamp=now - timedelta(minutes=rng.randint(1, 240)),
                host=t[4],
                user=t[5],
                process=t[6],
                src_ip=t[7],
                dest_ip=t[8],
                domain=t[9],
                file_hash=t[10],
            )
        )
    return sorted(alerts, key=lambda a: a.timestamp, reverse=True)
