import { useEffect, useState } from "react";
import { api, API_BASE } from "../api.js";

export default function StatusPill() {
  const [status, setStatus] = useState("checking"); // checking | online | offline

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        await api.health();
        if (alive) setStatus("online");
      } catch {
        if (alive) setStatus("offline");
      }
    };
    check();
    const t = setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const cls = status === "online" ? "online" : status === "offline" ? "offline" : "";
  const label = status === "online" ? "Backend online" : status === "offline" ? "Backend offline" : "Checking…";

  return (
    <>
      <span className="api-label">{API_BASE}</span>
      <span className={`status-pill ${cls}`} title={`GET ${API_BASE}/health`}>
        <span className="status-dot" />
        {label}
      </span>
    </>
  );
}
