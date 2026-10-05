import { useState } from "react";
import { api } from "../api.js";
import ScoreBar from "./ScoreBar.jsx";
import { SeverityBadge, VerdictBadge } from "./Badges.jsx";

const FIELDS = [
  ["id", "Alert ID"],
  ["source", "Source"],
  ["title", "Title"],
  ["description", "Description"],
  ["severity", "Severity"],
  ["timestamp", "Timestamp"],
  ["host", "Host"],
  ["user", "User"],
  ["process", "Process"],
  ["src_ip", "Source IP"],
  ["dest_ip", "Dest IP"],
  ["domain", "Domain"],
  ["file_hash", "File Hash"],
];

export default function AlertDetail({ alert, triage, onBack, onEnriched }) {
  const [enrichment, setEnrichment] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState("");

  const enrich = async () => {
    setEnriching(true);
    setError("");
    try {
      const e = await api.enrichAlert(alert.id);
      setEnrichment(e);
      onEnriched && onEnriched(e);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnriching(false);
    }
  };

  return (
    <div>
      <div className="detail-header">
        <button className="btn" onClick={onBack}>← Back to queue</button>
        <h2>Alert detail</h2>
        <SeverityBadge severity={alert.severity} />
      </div>

      {error && (
        <div className="banner error">
          {error}
          <button className="dismiss" onClick={() => setError("")}>×</button>
        </div>
      )}

      <div className="card">
        <h3>Alert fields</h3>
        <div className="kv-grid">
          {FIELDS.map(([key, label]) => (
            <div className="kv" key={key}>
              <div className="k">{label}</div>
              <div className="v">{alert[key] != null && alert[key] !== "" ? String(alert[key]) : "—"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Nemotron triage</h3>
        {triage ? (
          <>
            <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
              <ScoreBar score={triage.priority_score} />
              <VerdictBadge verdict={triage.verdict} />
              <span className="toolbar-info">confidence {(triage.confidence * 100).toFixed(0)}%</span>
              {triage.model && <span className="toolbar-info">{triage.model}</span>}
            </div>
            {triage.reasoning && <p className="reasoning-text">{triage.reasoning}</p>}
            {triage.recommended_action && (
              <p className="action-text">{triage.recommended_action}</p>
            )}
          </>
        ) : (
          <p className="toolbar-info">This alert has not been triaged yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Tavily threat intelligence</h3>
        {enrichment ? (
          <>
            {enrichment.iocs?.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: 0 }}>Indicators of compromise</div>
                <ul className="ioc-list">
                  {enrichment.iocs.map((ioc, i) => <li key={i}>{ioc}</li>)}
                </ul>
              </>
            )}
            {enrichment.summary && <p className="reasoning-text">{enrichment.summary}</p>}
            {enrichment.sources?.length > 0 && (
              <>
                <div className="section-label">Sources</div>
                <ul className="source-list">
                  {enrichment.sources.map((s, i) => (
                    <li key={i}>
                      <a href={s} target="_blank" rel="noreferrer">{s}</a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {(!enrichment.iocs?.length && !enrichment.summary) && (
              <p className="toolbar-info">No enrichment data returned.</p>
            )}
          </>
        ) : (
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn primary" onClick={enrich} disabled={enriching}>
              {enriching ? "Enriching…" : "Enrich with Tavily"}
            </button>
            {enriching && <span className="loading-inline"><span className="spinner" /> querying threat intel…</span>}
          </div>
        )}
      </div>

      {alert.raw && Object.keys(alert.raw).length > 0 && (
        <div className="card">
          <h3>Raw event</h3>
          <pre className="raw-json">{JSON.stringify(alert.raw, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
