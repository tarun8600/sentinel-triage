import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";
import StatusPill from "./components/StatusPill.jsx";
import { QueueRow, UntriagedRow } from "./components/QueueRows.jsx";
import AlertDetail from "./components/AlertDetail.jsx";
import IncidentsView from "./components/IncidentsView.jsx";

export default function App() {
  const [tab, setTab] = useState("queue"); // queue | incidents
  const [alerts, setAlerts] = useState([]);
  const [queueItems, setQueueItems] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [incidentTitle, setIncidentTitle] = useState("");
  const [detailAlertId, setDetailAlertId] = useState(null);

  const [loadingData, setLoadingData] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [triaging, setTriaging] = useState(null); // null | {done, total} | alertId string
  const [correlating, setCorrelating] = useState(false);
  const [refreshingIncidents, setRefreshingIncidents] = useState(false);
  const [error, setError] = useState("");

  const refreshAll = useCallback(async () => {
    setError("");
    try {
      const [a, q, inc] = await Promise.all([
        api.listAlerts(),
        api.queue(),
        api.listIncidents(),
      ]);
      setAlerts(a);
      setQueueItems(q);
      setIncidents(inc);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const triagedIds = useMemo(
    () => new Set(queueItems.map((i) => i.alert.id)),
    [queueItems]
  );
  const untriaged = useMemo(
    () => alerts.filter((a) => !triagedIds.has(a.id)),
    [alerts, triagedIds]
  );

  const generateMock = async () => {
    setGenerating(true);
    setError("");
    try {
      await api.ingestMock(12);
      await refreshAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const triageOne = async (id) => {
    setTriaging(id);
    setError("");
    try {
      await api.triageAlert(id);
      const q = await api.queue();
      setQueueItems(q);
    } catch (e) {
      setError(e.message);
    } finally {
      setTriaging(null);
    }
  };

  const triageAll = async () => {
    if (untriaged.length === 0) return;
    setError("");
    let done = 0;
    setTriaging({ done: 0, total: untriaged.length });
    try {
      for (const a of untriaged) {
        await api.triageAlert(a.id);
        done += 1;
        setTriaging({ done, total: untriaged.length });
      }
      const q = await api.queue();
      setQueueItems(q);
    } catch (e) {
      setError(`Triaged ${done}/${untriaged.length} before failing: ${e.message}`);
      try {
        const q = await api.queue();
        setQueueItems(q);
      } catch { /* keep prior state */ }
    } finally {
      setTriaging(null);
    }
  };

  const toggleCheck = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const correlate = async () => {
    const ids = [...selectedIds];
    const title = incidentTitle.trim() || "Correlated incident";
    if (ids.length === 0) return;
    setCorrelating(true);
    setError("");
    try {
      await api.correlate(ids, title);
      setSelectedIds(new Set());
      setIncidentTitle("");
      const inc = await api.listIncidents();
      setIncidents(inc);
      setTab("incidents");
    } catch (e) {
      setError(e.message);
    } finally {
      setCorrelating(false);
    }
  };

  const refreshIncidents = async () => {
    setRefreshingIncidents(true);
    setError("");
    try {
      setIncidents(await api.listIncidents());
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshingIncidents(false);
    }
  };

  const onEnriched = (enrichment) => {
    setQueueItems((prev) =>
      prev.map((i) =>
        i.alert.id === enrichment.alert_id ? { ...i, enrichment } : i
      )
    );
  };

  const detailItem = detailAlertId
    ? {
        alert: alerts.find((a) => a.id === detailAlertId) ||
          queueItems.find((i) => i.alert.id === detailAlertId)?.alert,
        triage: queueItems.find((i) => i.alert.id === detailAlertId)?.triage || null,
      }
    : null;

  const triageProgress =
    triaging && typeof triaging === "object"
      ? `Triaging ${triaging.done}/${triaging.total}…`
      : null;

  return (
    <>
      <header className="header">
        <div className="logo">S</div>
        <div className="title-block">
          <h1>SENTINEL TRIAGE</h1>
          <p>AI SOC analyst · Nemotron × Tavily</p>
        </div>
        <nav className="tabs">
          <button
            className={`tab ${tab === "queue" && !detailAlertId ? "active" : ""}`}
            onClick={() => { setTab("queue"); setDetailAlertId(null); }}
          >
            Queue
          </button>
          <button
            className={`tab ${tab === "incidents" ? "active" : ""}`}
            onClick={() => { setTab("incidents"); setDetailAlertId(null); }}
          >
            Incidents ({incidents.length})
          </button>
        </nav>
        <div className="header-right">
          <StatusPill />
        </div>
      </header>

      <main className="main">
        {error && (
          <div className="banner error">
            {error}
            <button className="dismiss" onClick={() => setError("")}>×</button>
          </div>
        )}

        {detailAlertId && detailItem?.alert ? (
          <AlertDetail
            alert={detailItem.alert}
            triage={detailItem.triage}
            onBack={() => setDetailAlertId(null)}
            onEnriched={onEnriched}
          />
        ) : tab === "incidents" ? (
          <IncidentsView
            incidents={incidents}
            loading={refreshingIncidents}
            onRefresh={refreshIncidents}
          />
        ) : (
          <div>
            <div className="toolbar">
              <button className="btn primary" onClick={generateMock} disabled={generating}>
                {generating ? "Generating…" : "Generate mock alerts"}
              </button>
              <button
                className="btn"
                onClick={triageAll}
                disabled={untriaged.length === 0 || !!triaging}
              >
                {triageProgress || "Triage all"}
              </button>
              <button className="btn" onClick={refreshAll} disabled={loadingData}>
                Refresh
              </button>
              {triaging && <span className="loading-inline"><span className="spinner" />{triageProgress || "Working…"}</span>}
              <div className="spacer" />
              <span className="toolbar-info">
                {queueItems.length} triaged · {untriaged.length} pending · {selectedIds.size} selected
              </span>
            </div>

            {selectedIds.size > 0 && (
              <div className="toolbar">
                <input
                  className="text-input"
                  placeholder="Incident title (e.g. Credential dumping on WS-FIN-042)"
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                />
                <button className="btn danger" onClick={correlate} disabled={correlating}>
                  {correlating ? "Correlating…" : `Correlate ${selectedIds.size} alert${selectedIds.size === 1 ? "" : "s"} into incident`}
                </button>
                <button className="btn small" onClick={() => setSelectedIds(new Set())}>
                  Clear selection
                </button>
              </div>
            )}

            {loadingData ? (
              <div className="empty-state">
                <p className="loading-inline"><span className="spinner" /> Loading queue…</p>
              </div>
            ) : queueItems.length === 0 && untriaged.length === 0 ? (
              <div className="empty-state">
                <h3>No alerts yet</h3>
                <p>Generate mock alerts to see Nemotron triage in action.</p>
                <button className="btn primary" onClick={generateMock} disabled={generating}>
                  {generating ? "Generating…" : "Generate mock alerts"}
                </button>
              </div>
            ) : (
              <>
                {queueItems.length > 0 && (
                  <>
                    <div className="section-label">Triage queue — critical first</div>
                    <div className="queue-list">
                      {queueItems.map((item) => (
                        <QueueRow
                          key={item.alert.id}
                          item={item}
                          checked={selectedIds.has(item.alert.id)}
                          onToggleCheck={() => toggleCheck(item.alert.id)}
                          onOpen={() => setDetailAlertId(item.alert.id)}
                        />
                      ))}
                    </div>
                  </>
                )}
                {untriaged.length > 0 && (
                  <>
                    <div className="section-label">Awaiting triage</div>
                    <div className="queue-list">
                      {untriaged.map((a) => (
                        <UntriagedRow
                          key={a.id}
                          alert={a}
                          checked={selectedIds.has(a.id)}
                          onToggleCheck={() => toggleCheck(a.id)}
                          onTriage={() => triageOne(a.id)}
                          triaging={triaging === a.id}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
