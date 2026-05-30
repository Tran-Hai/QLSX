"use client";

import { useState } from "react";
import { DashboardTab } from "./components/DashboardTab";
import { ProjectsTab } from "./components/ProjectsTab";
import { StaffTab } from "./components/StaffTab";
import { TasksTab } from "./components/TasksTab";
import { CalendarTab } from "./components/CalendarTab";
import { ReportTab } from "./components/ReportTab";
import { ProductionTab } from "./components/ProductionTab";
import { WarehouseTab } from "./components/WarehouseTab";
import { DailyLaborTab } from "./components/DailyLaborTab";
import { InstallationTab } from "./components/InstallationTab";
import { WeeklyPlanTab } from "./components/WeeklyPlanTab";
import { ActivityLogTab } from "./components/ActivityLogTab";
import { PurchaseTab } from "./components/PurchaseTab";
const SIDEBAR_ITEMS = [
  { id: "dashboard", icon: "▦", label: "Tổng quan" },
  { id: "projects", icon: "🏗", label: "Công trình" },
  { id: "staff", icon: "👥", label: "Nhân sự" },
  { id: "tasks", icon: "📌", label: "Công tác" },
  { id: "calendar", icon: "📅", label: "Lịch KH" },
  { id: "report", icon: "📊", label: "Báo cáo" },
  { id: "production", icon: "🏭", label: "Sản xuất" },
  { id: "warehouse", icon: "📦", label: "Kho" },
  { id: "daily_labor", icon: "📋", label: "Công nhật" },
  { id: "installation", icon: "🔧", label: "Lắp đặt" },
  { id: "weekly_plan", icon: "📈", label: "KH tuần" },
  { id: "purchase", icon: "🛒", label: "Đặt hàng" },
  { id: "activity_log", icon: "📜", label: "Nhật ký" },
];

const SECTIONS = [
  { label: "Chính", items: ["dashboard", "projects", "staff", "tasks"] },
  { label: "Kế hoạch", items: ["calendar", "report", "weekly_plan"] },
  { label: "Sản xuất", items: ["production", "warehouse", "purchase", "daily_labor", "installation"] },
  { label: "Theo dõi", items: ["activity_log"] },
];

const TabComponent: Record<string, React.ComponentType> = {
  dashboard: DashboardTab,
  projects: ProjectsTab,
  staff: StaffTab,
  tasks: TasksTab,
  calendar: CalendarTab,
  report: ReportTab,
  production: ProductionTab,
  warehouse: WarehouseTab,
  daily_labor: DailyLaborTab,
  installation: InstallationTab,
  weekly_plan: WeeklyPlanTab,
  purchase: PurchaseTab,
  activity_log: ActivityLogTab,
};

export default function Home() {
  const [tab, setTab] = useState("dashboard");

  const ActiveTab = TabComponent[tab] || DashboardTab;

  return (
    <div className="app-layout">
      <nav className="app-sidebar">
        <div className="sidebar-logo">
          <svg viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="10" height="10" rx="3" fill="currentColor" opacity="0.6"/>
            <rect x="16" y="2" width="10" height="10" rx="3" fill="currentColor" opacity="0.4"/>
            <rect x="2" y="16" width="10" height="10" rx="3" fill="currentColor" opacity="0.8"/>
            <rect x="16" y="16" width="10" height="10" rx="3" fill="currentColor"/>
          </svg>
          <span>QLSX</span>
        </div>
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section">{section.label}</div>
            {section.items.map((id) => {
              const item = SIDEBAR_ITEMS.find((i) => i.id === id)!;
              return (
                <button
                  key={id}
                  className={`tab-btn ${tab === id ? "active" : ""}`}
                  onClick={() => setTab(id)}
                >
                  <span className="tab-icon">{item.icon}</span>
                  <span className="tab-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <main className="app-main">
        <ActiveTab />
      </main>
    </div>
  );
}
