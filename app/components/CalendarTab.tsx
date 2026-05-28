"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { fmtDate, todayStr } from "@/lib/utils";
import { ALL_ITEMS, PROD_ITEMS, INST_ITEMS, ItemDef } from "@/lib/constants";

interface Project {
  id: string; name: string; location: string;
  prodTargets: Record<string, number>;
  instCfg: Record<string, number>;
  sxDeadlines: Record<string, string>;
  ldDeadlines: Record<string, string>;
}
interface ProdLog { id: string; projectId: string; itemId: string; qty: number; }
interface InstLog { id: string; projectId: string; itemId: string; qty: number; }

interface ItemRow {
  id: string; cat: "sx" | "ld"; projectId: string; projectName: string;
  projectLocation: string; itemDef: ItemDef; target: number; done: number;
  remaining: number; dailyOutput: number; daysNeeded: number;
  deadline: string; mustStart: string; buffer: number;
  status: string;
}

const STATUSES = [
  { id: "dung_kh", label: "Đúng KH", icon: "✅", color: "var(--green)" },
  { id: "can_chu_y", label: "Cần chú ý", icon: "⚠️", color: "var(--warn)" },
  { id: "can_gap", label: "Cần gấp", icon: "🔴", color: "orange" },
  { id: "khong_kip", label: "Không kịp", icon: "🚫", color: "var(--red)" },
  { id: "da_tre", label: "Đã trễ", icon: "⛔", color: "var(--red)" },
  { id: "chua_co_han", label: "Chưa có hạn", icon: "➖", color: "var(--t3)" },
];

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const days: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return { days, total: last.getDate() };
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function calcStatus(item: ItemRow): string {
  if (!item.deadline) return "chua_co_han";
  const deadline = new Date(item.deadline);
  const today = new Date(todayStr());
  const daysLeft = daysBetween(today, deadline);
  if (daysLeft < 0 && item.remaining > 0) return "da_tre";
  if (item.daysNeeded > daysLeft && item.remaining > 0) return "khong_kip";
  if (daysLeft <= 2) return "can_gap";
  if (daysLeft <= 5) return "can_chu_y";
  return "dung_kh";
}

export function CalendarTab() {
  const [view, setView] = useState<"bang" | "month" | "work">("bang");
  const [now] = useState(() => new Date());
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth()));
  const [projects, setProjects] = useState<Project[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [instLogs, setInstLogs] = useState<InstLog[]>([]);
  const [filterProject, setFilterProject] = useState("");
  const [workDays, setWorkDays] = useState<Record<string, "holiday" | "bad-weather">>({});

  const load = useCallback(() => {
    fetch("/api/projects").then(r=>r.json()).then(setProjects).catch(()=>{});
    fetch("/api/prod_logs").then(r=>r.json()).then(setProdLogs).catch(()=>{});
    fetch("/api/inst_logs").then(r=>r.json()).then(setInstLogs).catch(()=>{});
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    fetch("/api/app_settings").then(r=>r.json()).then((settings: any[]) => {
      const wd = settings.find((s: any) => s.key === "work_days");
      if (wd) setWorkDays(wd.value || {});
    }).catch(()=>{});
  }, []);

  const saveWorkDays = async (wd: Record<string, "holiday" | "bad-weather">) => {
    setWorkDays(wd);
    fetch("/api/app_settings", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ key: "work_days", value: wd, updatedAt: todayStr() }),
    }).catch(()=>{});
  };

  const buildItems = (): ItemRow[] => {
    const rows: ItemRow[] = [];
    const filtered = filterProject ? projects.filter(p => p.id === filterProject) : projects;
    for (const p of filtered) {
      for (const def of PROD_ITEMS) {
        const target = p.prodTargets[def.id] || 0;
        if (target <= 0) continue;
        const done = prodLogs.filter(l => l.projectId === p.id && l.itemId === def.id).reduce((s, l) => s + l.qty, 0);
        const remaining = target - done;
        const daysNeeded = Math.ceil(remaining / def.dailyOutput);
        const deadline = p.sxDeadlines[def.id] || "";
        const deadlineDate = deadline ? new Date(deadline) : null;
        const mustStart = deadlineDate ? fmtDate(new Date(deadlineDate.getTime() - daysNeeded * 86400000)) : "";
        const buffer = deadlineDate ? daysBetween(new Date(todayStr()), deadlineDate) - daysNeeded : 0;
        const row: ItemRow = {
          id: `sx-${p.id}-${def.id}`, cat: "sx", projectId: p.id,
          projectName: p.name, projectLocation: p.location,
          itemDef: def, target, done, remaining, dailyOutput: def.dailyOutput,
          daysNeeded, deadline, mustStart, buffer, status: "",
        };
        row.status = calcStatus(row);
        rows.push(row);
      }
      for (const def of INST_ITEMS) {
        const target = p.instCfg[def.id] || 0;
        if (target <= 0) continue;
        const done = instLogs.filter(l => l.projectId === p.id && l.itemId === def.id).reduce((s, l) => s + l.qty, 0);
        const remaining = target - done;
        const daysNeeded = Math.ceil(remaining / def.dailyOutput);
        const deadline = p.ldDeadlines[def.id] || "";
        const deadlineDate = deadline ? new Date(deadline) : null;
        const mustStart = deadlineDate ? fmtDate(new Date(deadlineDate.getTime() - daysNeeded * 86400000)) : "";
        const buffer = deadlineDate ? daysBetween(new Date(todayStr()), deadlineDate) - daysNeeded : 0;
        const row: ItemRow = {
          id: `ld-${p.id}-${def.id}`, cat: "ld", projectId: p.id,
          projectName: p.name, projectLocation: p.location,
          itemDef: def, target, done, remaining, dailyOutput: def.dailyOutput,
          daysNeeded, deadline, mustStart, buffer, status: "",
        };
        row.status = calcStatus(row);
        rows.push(row);
      }
    }
    return rows;
  };

  const items = buildItems();
  const summary = STATUSES.map(s => ({
    ...s,
    count: items.filter(i => i.status === s.id).length,
  }));

  const { days: monthDays, total: monthTotal } = getMonthDays(month.getFullYear(), month.getMonth());
  const monthStr = `${month.getMonth() + 1}/${month.getFullYear()}`;
  const today = todayStr();

  const monthEvents = items.filter(i => {
    if (!i.deadline) return false;
    const d = new Date(i.deadline);
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
  });

  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const handleWorkDayClick = (dateStr: string) => {
    const cur = workDays[dateStr];
    let next: "holiday" | "bad-weather" | undefined;
    if (!cur) next = "holiday";
    else if (cur === "holiday") next = "bad-weather";
    else next = undefined;
    const wd = { ...workDays };
    if (next) wd[dateStr] = next;
    else delete wd[dateStr];
    saveWorkDays(wd);
  };

  const countWorkDays = (type: "sx" | "ld") => {
    let total = 0, holidays = 0, badWeather = 0;
    for (let d = 1; d <= monthTotal; d++) {
      const date = new Date(month.getFullYear(), month.getMonth(), d);
      const ds = fmtDate(date);
      if (date > now) break;
      total++;
      if (workDays[ds] === "holiday") holidays++;
      if (workDays[ds] === "bad-weather") badWeather++;
    }
    if (type === "sx") return { total, work: total - holidays };
    return { total, work: total - holidays - badWeather };
  };

  const sxWork = countWorkDays("sx");
  const ldWork = countWorkDays("ld");
  const holidayCount = Object.values(workDays).filter(v => v === "holiday").length;
  const badWeatherCount = Object.values(workDays).filter(v => v === "bad-weather").length;

  return (
    <div>
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-16 flex-wrap gap-8">
        <h2>Lịch kế hoạch</h2>
        <div className="flex gap-8 items-center flex-wrap">
          <div className="view-switcher">
            {(["bang", "month", "work"] as const).map(v => (
              <button key={v} className={`view-btn ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
                <span className="vicon">{{ bang: "📋", month: "📅", work: "🔨" }[v]}</span>
                {{ bang: "Bảng KH", month: "Lịch tháng", work: "Lịch làm việc" }[v]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + Alerts */}
      <div className="cal-toolbar">
        <Select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{maxWidth:220}}>
          <option value="">Tất cả CT</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        {view === "bang" && (
          <div className="flex gap-8 items-center" style={{marginLeft:"auto"}}>
            <Button size="sm" variant="ghost" onClick={() => window.print()}><span className="vicon">🖨️</span> In lịch KH</Button>
            {items.filter(i => i.status === "da_tre" || i.status === "khong_kip").length > 0 && (
              <span className="badge br" style={{fontSize:12}}>
                🔴 {items.filter(i => i.status === "da_tre" || i.status === "khong_kip").length} hạng mục có vấn đề
              </span>
            )}
          </div>
        )}
        {(view === "month" || view === "work") && (
          <>
            <Button size="sm" variant="ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}>◀</Button>
            <span className="ct-label">{monthStr}</span>
            <Button size="sm" variant="ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}>▶</Button>
            <Button size="sm" variant="ghost" onClick={() => setMonth(new Date(now.getFullYear(), now.getMonth()))}>Tháng này</Button>
            <div className="ct-legend">
              <span className="leg-item"><span className="leg-swatch" style={{borderColor:"var(--red)"}} /> Ngày hạn</span>
              <span className="leg-item"><span className="leg-swatch" style={{borderColor:"var(--warn)"}} /> Cần bắt đầu</span>
            </div>
          </>
        )}
      </div>

      {/* ===== BẢNG KH ===== */}
      {view === "bang" && (
        <>
          <div className="status-cards">
            {summary.map(s => (
              <div key={s.id} className="status-card" style={s.id === "khong_kip" || s.id === "da_tre" ? {background:"var(--red-bg)"} : {}}>
                <div className="sicon" style={{background:s.color+"18"}}>{s.icon}</div>
                <div className="sinfo">
                  <div className="snum" style={{color: s.id === "khong_kip" || s.id === "da_tre" ? "var(--red)" : undefined}}>
                    {s.count}
                  </div>
                  <div className="slabel">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{padding:0, overflow:"hidden"}}>
            <div className="table-wrap">
              <table style={{minWidth:1200}}>
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th style={{minWidth:160}}>Công trình</th>
                    <th style={{minWidth:180}}>Hạng mục</th>
                    <th style={{textAlign:"center"}}>KL cần</th>
                    <th style={{textAlign:"center"}}>Đã xong</th>
                    <th style={{textAlign:"center"}}>Còn lại</th>
                    <th style={{textAlign:"center"}}>ĐM/ng</th>
                    <th style={{textAlign:"center"}}>Cần (ngày)</th>
                    <th>Ngày hạn</th>
                    <th>Cần bắt đầu từ</th>
                    <th style={{textAlign:"center"}}>Buffer</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.id}>
                      <td>
                        <span className={`badge ${i.cat === "sx" ? "bi" : ""}`} style={{fontSize:10}}>
                          {i.cat === "sx" ? "🔧 SX" : "🔨 LĐ"}
                        </span>
                      </td>
                      <td>
                        <div style={{fontWeight:600}}>{i.projectName}</div>
                        <div className="text-xs text-t2">📍 {i.projectLocation}</div>
                      </td>
                      <td style={{fontSize:12}}>{i.itemDef.label}</td>
                      <td style={{textAlign:"center"}}>{i.target}</td>
                      <td style={{textAlign:"center", color:"var(--green)", fontWeight:600}}>{i.done}</td>
                      <td style={{textAlign:"center", color:i.remaining > 0 ? "var(--red)" : "var(--green)", fontWeight:600}}>
                        {i.remaining}
                      </td>
                      <td style={{textAlign:"center"}}>{i.dailyOutput}</td>
                      <td style={{textAlign:"center", fontWeight:600}}>{i.daysNeeded}</td>
                      <td style={i.deadline && new Date(i.deadline) < new Date(today) ? {color:"var(--red)", fontWeight:700} : {}}>
                        {i.deadline || <span className="text-t2">—</span>}
                      </td>
                      <td>
                        {i.mustStart ? (
                          <span style={new Date(i.mustStart) <= new Date(today) ? {color:"var(--red)", fontWeight:600} : {}}>
                            {i.mustStart}
                            {new Date(i.mustStart) <= new Date(today) && <span className="text-xs" style={{color:"var(--red)", marginLeft:4}}>← Bắt đầu ngay!</span>}
                          </span>
                        ) : <span className="text-t2">—</span>}
                      </td>
                      <td style={{textAlign:"center", color: i.buffer < 0 ? "var(--red)" : i.buffer < 3 ? "var(--warn)" : "var(--green)", fontWeight:600}}>
                        {i.deadline ? i.buffer : <span className="text-t2">—</span>}
                      </td>
                      <td>
                        <span className={`badge ${i.status === "da_tre" || i.status === "khong_kip" ? "br" : i.status === "can_gap" ? "bw" : i.status === "dung_kh" ? "bg" : ""}`}>
                          {STATUSES.find(s => s.id === i.status)?.label || i.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={12} className="text-center text-t2" style={{padding:30}}>Không có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== LỊCH THÁNG ===== */}
      {view === "month" && (
        <>
          <div className="month-grid">
            {dayNames.map(d => <div key={d} className="mg-header">{d}</div>)}
            {monthDays.map((d, idx) => {
              if (!d) return <div key={`e-${idx}`} className="mg-day other-month" />;
              const ds = fmtDate(d);
              const isToday = ds === today;
              const dayEvents = monthEvents.filter(e => e.deadline === ds);
              const hasDeadline = dayEvents.some(e => e.deadline === ds);
              const starts = items.filter(i => i.mustStart === ds);
              return (
                <div key={ds} className={`mg-day ${isToday ? "today" : ""} ${hasDeadline ? "has-deadline" : ""} ${starts.length > 0 ? "has-start" : ""}`}>
                  <div className="mg-num">{d.getDate()}</div>
                  {dayEvents.map(e => (
                    <div key={e.id} className={`mg-event ${e.cat}`} title={`${e.projectName} - ${e.itemDef.label}`}>
                      {e.projectName} - {e.itemDef.label}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="card">
            <h3 className="mb-12" style={{fontSize:15}}>Chi tiết tháng {monthStr}</h3>
            <div className="month-details">
              {monthEvents.length === 0 ? (
                <div className="text-center text-t2" style={{padding:20}}>Không có sự kiện trong tháng này</div>
              ) : (
                monthEvents.sort((a, b) => a.deadline.localeCompare(b.deadline)).map(e => (
                  <div key={e.id} className="md-row">
                    <span className="md-date">{e.deadline}</span>
                    <span style={{fontSize:16}}>{e.cat === "sx" ? "🔧" : "🔨"}</span>
                    <span><strong>{e.projectName}</strong> - {e.itemDef.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== LỊCH LÀM VIỆC ===== */}
      {view === "work" && (
        <>
          <div className="work-tiles">
            <div className="work-tile" style={{borderLeft:"3px solid var(--blue)"}}>
              <div className="wt-icon">🔧</div>
              <div className="wt-title">Công SX tháng</div>
              <div className="wt-big" style={{color:"var(--blue)"}}>{sxWork.total}</div>
              <div className="wt-sub">{sxWork.work} công</div>
            </div>
            <div className="work-tile" style={{borderLeft:"3px solid var(--green)"}}>
              <div className="wt-icon">🔨</div>
              <div className="wt-title">Công LĐ tháng</div>
              <div className="wt-big" style={{color:"var(--green)"}}>{ldWork.total}</div>
              <div className="wt-sub">{ldWork.work} công</div>
            </div>
            <div className="work-tile" style={{borderLeft:"3px solid var(--warn)"}}>
              <div className="wt-icon">🏖️</div>
              <div className="wt-title">Ngày nghỉ lễ</div>
              <div className="wt-big" style={{color:"var(--warn)"}}>{holidayCount}</div>
              <div className="wt-sub">SX + LĐ đều nghỉ</div>
            </div>
            <div className="work-tile" style={{borderLeft:"3px solid rgba(100,200,255,0.8)"}}>
              <div className="wt-icon">🌧️</div>
              <div className="wt-title">TT xấu (LĐ)</div>
              <div className="wt-big" style={{color:"rgba(100,200,255,0.8)"}}>{badWeatherCount}</div>
              <div className="wt-sub">LĐ nghỉ, SX làm</div>
            </div>
          </div>

          <div className="work-legend">
            <span className="wl-item"><kbd>Click 1x</kbd> → Nghỉ lễ (đỏ)</span>
            <span className="wl-item"><kbd>Click 2x</kbd> → Thời tiết xấu LĐ (xanh)</span>
            <span className="wl-item"><kbd>Click 3x</kbd> → Ngày làm bình thường</span>
          </div>

          <div className="month-grid">
            {dayNames.map(d => <div key={d} className="mg-header">{d}</div>)}
            {monthDays.map((d, idx) => {
              if (!d) return <div key={`e-${idx}`} className="wg-day other-month" />;
              const ds = fmtDate(d);
              const isToday = ds === today;
              const wd = workDays[ds];
              return (
                <div key={ds}
                  className={`wg-day ${isToday ? "today" : ""} ${wd === "holiday" ? "holiday" : wd === "bad-weather" ? "bad-weather" : ""}`}
                  onClick={() => handleWorkDayClick(ds)}
                >
                  <div className="mg-num">{d.getDate()}</div>
                  {wd === "holiday" && <div className="wg-label">🏖️ Nghỉ lễ</div>}
                  {wd === "bad-weather" && <div className="wg-label">🌧️ TT xấu</div>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
