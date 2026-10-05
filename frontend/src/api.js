/* API client for the Sentinel Triage FastAPI backend.
 * Base URL is configurable via VITE_API_URL (default http://localhost:8000).
 */

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export const API_BASE = BASE;

async function req(path, opts = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
  } catch (e) {
    throw new Error(`Cannot reach backend at ${BASE} — is it running? (${e.message})`);
  }
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j.detail || JSON.stringify(j);
    } catch {
      detail = await res.text();
    }
    throw new Error(`Backend error ${res.status}: ${detail || res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  health: () => req("/health"),
  ingestMock: (n = 12) =>
    req("/alerts/ingest", {
      method: "POST",
      body: JSON.stringify({ alerts: [], generate_mock: n }),
    }),
  listAlerts: () => req("/alerts"),
  triageAlert: (id) =>
    req(`/alerts/${encodeURIComponent(id)}/triage`, { method: "POST" }),
  enrichAlert: (id) =>
    req(`/alerts/${encodeURIComponent(id)}/enrich`, { method: "POST" }),
  queue: () => req("/queue"),
  correlate: (alert_ids, title) =>
    req("/incidents/correlate", {
      method: "POST",
      body: JSON.stringify({ alert_ids, title }),
    }),
  listIncidents: () => req("/incidents"),
};
