"use client";

import { useEffect, useState } from "react";
import { StatCard } from "./StatCard";

export function DashboardTab() {
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const cards = [
    { icon: "🏗️", num: stats.projects ?? 0, label: "Công trình", color: "blue" as const },
    { icon: "👥", num: stats.staff ?? 0, label: "Nhân sự", color: "green" as const },
    { icon: "📌", num: stats.tasks ?? 0, label: "Công tác", color: "purple" as const },
    { icon: "🏭", num: stats.prodLogs ?? 0, label: "SX hôm nay", color: "warn" as const },
    { icon: "🔧", num: stats.instLogs ?? 0, label: "LĐ hôm nay", color: "blue" as const },
    { icon: "📦", num: stats.khoEntries ?? 0, label: "Nhập kho", color: "green" as const },
    { icon: "📋", num: stats.congNhat ?? 0, label: "Công nhật", color: "purple" as const },
    { icon: "🏖️", num: stats.leaves ?? 0, label: "Nghỉ phép", color: "warn" as const },
  ];

  return (
    <div>
      <h2>Tổng quan</h2>
      <div className="card-row">
        {cards.map((c) => (
          <StatCard key={c.label} icon={c.icon} num={c.num} label={c.label} color={c.color} />
        ))}
      </div>
    </div>
  );
}
