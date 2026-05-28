"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { getMon, weekDates, weekRangeStr, fmtDate, addDays, todayStr } from "@/lib/utils";

interface Project {
  id: string; name: string;
  sxDeadlines: Record<string, string>;
  ldDeadlines: Record<string, string>;
  prodTargets: Record<string, number>;
}
interface TaskItem {
  id: string; name: string; projectId: string; projectName: string;
  dueDate: string; status: string; icon: string;
}

export function CalendarTab() {
  const [mon, setMon] = useState(() => getMon(new Date()));
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    fetch("/api/projects").then(r=>r.json()).then(setProjects).catch(()=>{});
    fetch("/api/tasks").then(r=>r.json()).then(setTasks).catch(()=>{});
  }, []);

  const dates = weekDates(mon);
  const today = todayStr();
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div>
      <div className="flex justify-between items-center mb-16">
        <h2>Lịch kế hoạch</h2>
        <div className="flex gap-8 items-center">
          <Button size="sm" variant="ghost" onClick={() => setMon(addDays(mon, -7))}>◀</Button>
          <span className="text-sm" style={{fontWeight:500, minWidth:160, textAlign:"center"}}>{weekRangeStr(mon)}</span>
          <Button size="sm" variant="ghost" onClick={() => setMon(addDays(mon, 7))}>▶</Button>
          <Button size="sm" variant="ghost" onClick={() => setMon(getMon(new Date()))}>Hôm nay</Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="card text-center text-t2" style={{padding:40}}>Chưa có dữ liệu công trình</div>
      ) : (
        <div className="table-wrap">
          <table className="cal-table">
            <thead>
              <tr>
                <th style={{width:140, textAlign:"left", paddingLeft:12}}>Hạng mục</th>
                {dates.map((d, i) => {
                  const ds = fmtDate(d);
                  const isToday = ds === today;
                  return (
                    <th key={ds} style={isToday ? {background:"var(--blue-bg)"} : undefined}>
                      <div style={{fontWeight: isToday ? 700 : 500}}>{dayNames[i]}</div>
                      <div style={{fontSize:10, opacity:0.6}}>{ds.slice(5)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {projects.flatMap(p => {
                const sxItems = Object.entries(p.sxDeadlines || {}).map(([itemId, deadline]) => ({ itemId, deadline, type: "SX" as const }));
                const ldItems = Object.entries(p.ldDeadlines || {}).map(([itemId, deadline]) => ({ itemId, deadline, type: "LĐ" as const }));
                const allItems = [...sxItems, ...ldItems];
                return allItems.length > 0
                  ? allItems.map(({ itemId, deadline, type }, idx) => {
                      const isOverdue = deadline < today;
                      return (
                        <tr key={`${p.id}-${itemId}-${idx}`}>
                          <td style={{fontSize:12, fontWeight:500, paddingLeft:12}}>
                            <span className="text-t2">{p.name}</span>
                            <br />
                            <span className={`badge ${type === "SX" ? "bi" : ""}`} style={{marginRight:6, fontSize:10}}>{type}</span>
                            <span>{itemId}</span>
                            {isOverdue && <span className="badge br" style={{marginLeft:8}}>Quá hạn</span>}
                          </td>
                          {dates.map(d => {
                            const ds = fmtDate(d);
                            const isDeadline = deadline === ds;
                            const dayTasks = tasks.filter(t => t.dueDate === ds && t.projectId === p.id);
                            return (
                              <td key={ds} style={{background: isDeadline && isOverdue ? "var(--red-bg)" : isDeadline ? "var(--green-bg)" : undefined}}>
                                {isDeadline && (
                                  <div className="cal-item" style={{background:"transparent", padding:0}}>
                                    📅 Hạn {type}
                                  </div>
                                )}
                                {dayTasks.map(t => {
                                  const overdue = t.dueDate < today && t.status !== "done";
                                  return (
                                    <div key={t.id} className={`cal-item ${overdue ? "overdue" : ""} ${t.status === "done" ? "done" : ""}`}>
                                      {t.status === "done" ? "✅" : "📌"} {t.name}
                                    </div>
                                  );
                                })}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  : [];
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
