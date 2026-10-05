import ScoreBar from "./ScoreBar.jsx";
import { SeverityBadge, VerdictBadge, SEVERITY_COLORS } from "./Badges.jsx";

function fmtTime(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

/* One row in the triage queue. item = { alert, triage, enrichment|null } */
export function QueueRow({ item, checked, onToggleCheck, onOpen }) {
  const { alert, triage } = item;
  const border = SEVERITY_COLORS[(alert.severity || "informational").toLowerCase()] || "#6b7280";

  return (
    <div
      className="alert-row"
      style={{ borderLeftColor: border }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      <input
        type="checkbox"
        className="checkbox"
        checked={checked}
        onChange={(e) => {
          e.stopPropagation();
          onToggleCheck();
        }}
        onClick={(e) => e.stopPropagation()}
        title="Select for incident correlation"
      />
      <div className="alert-row-main">
        <p className="alert-row-title">{alert.title}</p>
        <div className="alert-row-meta">
          <span>{alert.id}</span>
          <span>{alert.host || "no host"}</span>
          <span>{alert.user || "no user"}</span>
          <span>{fmtTime(alert.timestamp)}</span>
        </div>
        {triage?.reasoning && <p className="alert-row-reason">{triage.reasoning}</p>}
      </div>
      <div className="alert-row-side">
        <ScoreBar score={triage?.priority_score} />
        <VerdictBadge verdict={triage?.verdict} />
        <SeverityBadge severity={alert.severity} />
      </div>
    </div>
  );
}

/* Row for an alert that has not been triaged yet. */
export function UntriagedRow({ alert, checked, onToggleCheck, onTriage, triaging }) {
  return (
    <div className="alert-row" style={{ opacity: 0.85 }}>
      <input
        type="checkbox"
        className="checkbox"
        checked={checked}
        onChange={onToggleCheck}
        title="Select for incident correlation"
      />
      <div className="alert-row-main" onClick={onTriage} style={{ cursor: "pointer" }}>
        <p className="alert-row-title">{alert.title}</p>
        <div className="alert-row-meta">
          <span>{alert.id}</span>
          <span>{alert.host || "no host"}</span>
          <span>{alert.user || "no user"}</span>
          <span>{fmtTime(alert.timestamp)}</span>
        </div>
        <p className="alert-row-reason" style={{ fontStyle: "italic" }}>
          {triaging ? "Triaging…" : "Not triaged yet — click to triage with Nemotron."}
        </p>
      </div>
      <div className="alert-row-side">
        <SeverityBadge severity={alert.severity} />
        <button className="btn small" onClick={onTriage} disabled={triaging}>
          {triaging ? "Working…" : "Triage"}
        </button>
      </div>
    </div>
  );
}
