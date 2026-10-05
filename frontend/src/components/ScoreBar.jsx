import { scoreColor } from "./Badges.jsx";

export default function ScoreBar({ score }) {
  const s = Math.round(score ?? 0);
  const color = scoreColor(s);
  return (
    <div className="score-wrap" title={`Priority score: ${s}/100`}>
      <span className="score-num" style={{ color }}>{s}</span>
      <div className="score-bar">
        <div className="score-fill" style={{ width: `${s}%`, background: color }} />
      </div>
    </div>
  );
}
