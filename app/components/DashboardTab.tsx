"use client";

import { useEffect, useState, useMemo } from "react";
import { StatCard } from "./StatCard";
import { ALL_ITEMS, KHO_INST_MAP } from "@/lib/constants";
import { todayStr } from "@/lib/utils";

interface Project {
  id: string; name: string; location: string;
  prodTargets: Record<string,number>; instCfg: Record<string,number>;
  sxDeadlines: Record<string,string>; ldDeadlines: Record<string,string>;
  prodBatches: Record<string,number>;
}
interface ProdLog { id: string; projectId: string; itemId: string; qty: number; date: string; }
interface InstLog { id: string; projectId: string; itemId: string; qty: number; date: string; }
interface KhoEntry { id: string; projectId: string; itemId: string; qty: number; }

function r2(v: number) { return Math.round(v * 100) / 100; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export function DashboardTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [instLogs, setInstLogs] = useState<InstLog[]>([]);
  const [khoEntries, setKhoEntries] = useState<KhoEntry[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [congNhat, setCongNhat] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then(r=>r.json()),
      fetch("/api/prod_logs").then(r=>r.json()),
      fetch("/api/inst_logs").then(r=>r.json()),
      fetch("/api/kho_entries").then(r=>r.json()),
      fetch("/api/staff").then(r=>r.json()),
      fetch("/api/tasks").then(r=>r.json()),
      fetch("/api/cong_nhat").then(r=>r.json()),
      fetch("/api/leaves").then(r=>r.json()),
    ]).then(([p, pl, il, ke, s, t, cn, l]) => {
      setProjects(p); setProdLogs(pl); setInstLogs(il); setKhoEntries(ke);
      setStaff(s); setTasks(t); setCongNhat(cn); setLeaves(l);
    }).catch(()=>{});
  }, []);

  const today = todayStr();
  const todayProd = useMemo(() => prodLogs.filter(l => l.date === today).length, [prodLogs, today]);
  const todayInst = useMemo(() => instLogs.filter(l => l.date === today).length, [instLogs, today]);

  const projectDetails = useMemo(() => {
    return projects.map(p => {
      const prodTargets = p.prodTargets || {};
      const instCfg = p.instCfg || {};
      const prodKeys = Object.keys(prodTargets).filter(k => ALL_ITEMS.some(x => x.id === k));
      const instKeys = Object.keys(instCfg).filter(k => ALL_ITEMS.some(x => x.id === k));

      const prodItems = prodKeys.map(itemId => {
        const def = ALL_ITEMS.find(x => x.id === itemId)!;
        const produced = prodLogs
          .filter(l => l.projectId === p.id && l.itemId === itemId)
          .reduce((s, l) => s + l.qty, 0);
        const target = prodTargets[itemId] || 0;
        const remaining = Math.max(0, target - produced);
        const pct = target > 0 ? clamp(produced / target * 100, 0, 100) : 0;
        return { itemId, itemName: def.label, unit: def.unit, target, produced: r2(produced), remaining: r2(remaining), pct };
      }).filter(i => i.target > 0);

      const instItems = instKeys.map(itemId => {
        const def = ALL_ITEMS.find(x => x.id === itemId)!;
        const installed = instLogs
          .filter(l => l.projectId === p.id && l.itemId === itemId)
          .reduce((s, l) => s + l.qty, 0);
        const target = instCfg[itemId] || 0;
        const remaining = Math.max(0, target - installed);
        const mappedId = KHO_INST_MAP[itemId];
        const khoQty = khoEntries
          .filter(e => e.projectId === p.id && (e.itemId === itemId || e.itemId === mappedId))
          .reduce((s, e) => s + e.qty, 0);
        const pct = target > 0 ? clamp(installed / target * 100, 0, 100) : 0;
        return { itemId, itemName: def.label, unit: def.unit, target, installed: r2(installed), remaining: r2(remaining), khoQty: r2(khoQty), pct };
      }).filter(i => i.target > 0);

      const totalTarget = prodItems.reduce((s, i) => s + i.target, 0) + instItems.reduce((s, i) => s + i.target, 0);
      const totalDone = prodItems.reduce((s, i) => s + i.produced, 0) + instItems.reduce((s, i) => s + i.installed, 0);
      const overallPct = totalTarget > 0 ? clamp(totalDone / totalTarget * 100, 0, 100) : 0;

      return { project: p, prodItems, instItems, overallPct };
    }).filter(g => g.prodItems.length > 0 || g.instItems.length > 0);
  }, [projects, prodLogs, instLogs, khoEntries]);

  const barColor = (pct: number) => pct >= 100 ? "var(--green)" : pct >= 50 ? "var(--warn)" : "var(--blue)";

  return (
    <div>
      <h2 className="mb-16">Tổng quan</h2>

      {/* Stat cards */}
      <div className="card-row">
        <StatCard icon="🏗️" num={projects.length} label="Công trình" color="blue" />
        <StatCard icon="👥" num={staff.length} label="Nhân sự" color="green" />
        <StatCard icon="📌" num={tasks.length} label="Công tác" color="purple" />
        <StatCard icon="🏭" num={todayProd} label="SX hôm nay" color="warn" />
        <StatCard icon="🔧" num={todayInst} label="LĐ hôm nay" color="blue" />
        <StatCard icon="📦" num={khoEntries.length} label="Nhập kho" color="green" />
        <StatCard icon="📋" num={congNhat.length} label="Công nhật" color="purple" />
        <StatCard icon="🏖️" num={leaves.length} label="Nghỉ phép" color="warn" />
      </div>

      {/* Per-project details */}
      {projectDetails.length === 0 ? (
        <div className="pd-empty" style={{marginTop:24}}>
          <div style={{fontSize:48, opacity:0.4, marginBottom:12}}>🏗️</div>
          <div>Chưa có công trình hoặc hạng mục nào.</div>
        </div>
      ) : (
        <div style={{marginTop:24, display:"flex", flexDirection:"column", gap:16}}>
          {projectDetails.map(g => (
            <div key={g.project.id} className="card">
              {/* Project header */}
              <div className="flex justify-between items-center mb-12">
                <div>
                  <span className="font-bold" style={{fontSize:16}}>{g.project.name}</span>
                  <span className="text-t2" style={{marginLeft:8, fontSize:12}}>📍 {g.project.location}</span>
                </div>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <span style={{fontSize:12, color:"var(--t2)"}}>{r2(g.overallPct)}%</span>
                  <div className="dash-progress-bar">
                    <div style={{width:`${g.overallPct}%`, height:"100%", background:barColor(g.overallPct), borderRadius:4, transition:"width 0.3s"}} />
                  </div>
                </div>
              </div>

              {/* Production items */}
              {g.prodItems.length > 0 && (
                <div style={{marginBottom:12}}>
                  <div className="rp-group-header" style={{background:"var(--blue-bg)", marginBottom:8}}>🔧 Sản xuất</div>
                  <div style={{overflowX:"auto"}}>
                    <table className="pd-table" style={{fontSize:12}}>
                      <thead>
                        <tr>
                          <th className="left">Hạng mục</th>
                          <th style={{minWidth:50}}>Mục tiêu</th>
                          <th style={{minWidth:50}}>Đã SX</th>
                          <th style={{minWidth:50}}>Còn lại</th>
                          <th style={{minWidth:120}}>Tiến độ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.prodItems.map(item => (
                          <tr key={item.itemId}>
                            <td className="left">
                              <div style={{fontSize:11, lineHeight:1.3}}>{item.itemName}</div>
                            </td>
                            <td className="pd-num">{item.target} {item.unit}</td>
                            <td className="pd-num blue">{item.produced}</td>
                            <td className="pd-num" style={{color:item.remaining > 0 ? "var(--red)" : "var(--green)", fontWeight:700}}>
                              {item.remaining > 0 ? `${item.remaining} ${item.unit}` : "✅"}
                            </td>
                            <td>
                              <div className="db-bar-wrap">
                                <div className="db-bar-fill" style={{width:`${item.pct}%`, background:barColor(item.pct)}} />
                                <span className="db-bar-text">{r2(item.pct)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Installation items */}
              {g.instItems.length > 0 && (
                <div>
                  <div className="rp-group-header" style={{background:"var(--green-bg)", marginBottom:8}}>🔨 Lắp đặt</div>
                  <div style={{overflowX:"auto"}}>
                    <table className="pd-table" style={{fontSize:12}}>
                      <thead>
                        <tr>
                          <th className="left">Hạng mục</th>
                          <th style={{minWidth:50}}>Cần LĐ</th>
                          <th style={{minWidth:50}}>Đã LĐ</th>
                          <th style={{minWidth:50}}>Còn lại</th>
                          <th style={{minWidth:45}}>Kho</th>
                          <th style={{minWidth:120}}>Tiến độ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.instItems.map(item => (
                          <tr key={item.itemId}>
                            <td className="left">
                              <div style={{fontSize:11, lineHeight:1.3}}>{item.itemName}</div>
                            </td>
                            <td className="pd-num">{item.target} {item.unit}</td>
                            <td className="pd-num green">{item.installed}</td>
                            <td className="pd-num" style={{color:item.remaining > 0 ? "var(--red)" : "var(--green)", fontWeight:700}}>
                              {item.remaining > 0 ? `${item.remaining} ${item.unit}` : "✅"}
                            </td>
                            <td>
                              {item.khoQty > 0 ? <span className="pd-num">{item.khoQty}</span> :
                                <span style={{color:"var(--t3)", fontSize:11}}>—</span>}
                            </td>
                            <td>
                              <div className="db-bar-wrap">
                                <div className="db-bar-fill" style={{width:`${item.pct}%`, background:barColor(item.pct)}} />
                                <span className="db-bar-text">{r2(item.pct)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
