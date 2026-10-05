import ScoreBar from "./ScoreBar.jsx";

function fmtTime(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function IncidentsView({ incidents, loading, onRefresh }) {
  return (
    <div>
      <div className="toolbar">
        <span className="toolbar-info">
          {incidents.length} incident{incidents.length === 1 ? "" : "s"}
        </span>
        <div className="spacer" />
        <button className="btn" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {loading && incidents.length === 0 && (
        <div className="empty-state"><p className="loading-inline"><span className="spinner" /> Loading incidents…</p></div>
      )}

      {!loading && incidents.length === 0 && (
        <div className="empty-state">
          <h3>No incidents yet</h3>
          <p>Select alerts in the queue and correlate them into an incident.</p>
        </div>
      )}

      {incidents.map((inc) => (
        <div className="card incident-card" key={inc.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 6 }}>
            <h3 style={{ margin: 0 }}>{inc.title}</h3>
            <ScoreBar score={inc.priority_score} />
          </div>
          <div className="incident-meta">
            {inc.id} · {inc.alert_ids.length} alert{inc.alert_ids.length === 1 ? "" : "s"} · {fmtTime(inc.created_at)}
          </div>
          {inc.brief && <p className="incident-brief">{inc.brief}</p>}
          {inc.recommended_actions?.length > 0 && (
            <>
              <div className="section-label" style={{ marginTop: 4 }}>Recommended actions</div>
              <ul className="rec-actions">
                {inc.recommended_actions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </>
          )}
          {inc.alert_ids?.length > 0 && (
            <div className="section-label">Alert IDs</div>
          )}
          {inc.alert_ids?.length > 0 && (
            <ul className="ioc-list">
              {inc.alert_ids.map((id) => <li key={id}>{id}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
