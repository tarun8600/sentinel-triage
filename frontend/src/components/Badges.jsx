/* Severity / verdict color helpers and badge components. No emojis. */

export const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#eab308",
  low: "#3b82f6",
  informational: "#6b7280",
};

export const VERDICT_META = {
  true_positive: { label: "True Positive", color: "#ef4444" },
  likely_true_positive: { label: "Likely True Positive", color: "#f59e0b" },
  needs_review: { label: "Needs Review", color: "#eab308" },
  likely_false_positive: { label: "Likely False Positive", color: "#3b82f6" },
  false_positive: { label: "False Positive", color: "#6b7280" },
};

export function scoreColor(score) {
  if (score >= 80) return "#ef4444";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#eab308";
  if (score >= 20) return "#3b82f6";
  return "#6b7280";
}

export function Badge({ label, color }) {
  return (
    <span
      className="badge"
      style={{ color, borderColor: color + "55", background: color + "14" }}
    >
      {label}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const key = (severity || "informational").toLowerCase();
  const color = SEVERITY_COLORS[key] || SEVERITY_COLORS.informational;
  return <Badge label={key.replace("_", " ")} color={color} />;
}

export function VerdictBadge({ verdict }) {
  const meta = VERDICT_META[verdict] || { label: verdict || "unknown", color: "#6b7280" };
  return <Badge label={meta.label} color={meta.color} />;
}
