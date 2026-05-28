"use client";

export function StatCard({
  icon,
  num,
  label,
  color = "blue",
}: {
  icon: string;
  num: number | string;
  label: string;
  color?: "blue" | "green" | "warn" | "red" | "purple";
}) {
  return (
    <div className="stat-card">
      <div className={`icon-wrap ${color}`}>{icon}</div>
      <div className="info">
        <div className="num">{num}</div>
        <div className="label">{label}</div>
      </div>
    </div>
  );
}
