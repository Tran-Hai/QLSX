"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Select } from "./ui/Select";

interface ActivityLog {
  id: string; date: string; time: string;
  projectId: string; projectName: string;
  itemId: string; itemName: string; unit: string;
  qty: number;
  action: string; actionLabel: string;
  actorName: string; actorRole: string;
  note: string; createdAt: string;
}

interface Project { id: string; name: string; }

function r2(v: number) { return Math.round(v * 100) / 100; }

export function ActivityLogTab() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterProject, setFilterProject] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/activity_logs").then(r=>r.json()),
      fetch("/api/projects").then(r=>r.json()),
    ]).then(([l, p]) => {
      setLogs(l); setProjects(p);
    }).catch(()=>{});
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(() => {
    let list = [...logs];
    if (filterProject) list = list.filter(l => l.projectId === filterProject);
    if (filterAction) list = list.filter(l => l.action === filterAction);
    if (filterFrom) list = list.filter(l => l.date >= filterFrom);
    if (filterTo) list = list.filter(l => l.date <= filterTo);
    list.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || "00:00").localeCompare(a.time || "00:00");
    });
    return list;
  }, [logs, filterProject, filterAction, filterFrom, filterTo]);

  return (
    <div>
      <h2 className="mb-16">Nhật ký biến động vật tư & thi công</h2>

      {/* Filters */}
      <div className="cal-toolbar" style={{flexWrap:"wrap", gap:8}}>
        <Select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{maxWidth:220}}>
          <option value="">📊 Tất cả CT</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{maxWidth:180}}>
          <option value="">🔍 Tất cả loại</option>
          <option value="nhap_kho">🟦 Nhập kho (Sản xuất)</option>
          <option value="ra_cong_truong">🟩 Ra công trường (Lắp đặt)</option>
        </Select>
        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
          style={{maxWidth:150, padding:"6px 10px", borderRadius:20, border:"1px solid var(--hover)",
            background:"rgba(0,0,0,0.03)", color:"var(--t2)", fontSize:13}} placeholder="Từ ngày" />
        <span className="text-t2" style={{fontSize:12}}>→</span>
        <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
          style={{maxWidth:150, padding:"6px 10px", borderRadius:20, border:"1px solid var(--hover)",
            background:"rgba(0,0,0,0.03)", color:"var(--t2)", fontSize:13}} placeholder="Đến ngày" />
        <span className="text-t2" style={{marginLeft:"auto", fontSize:12}}>
          📝 {filtered.length} dòng
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{overflowX:"auto"}}>
        <table className="pd-table" style={{minWidth:800}}>
          <thead>
            <tr>
              <th style={{minWidth:130}}>Thời gian</th>
              <th className="left" style={{minWidth:180}}>Công trình</th>
              <th className="left" style={{minWidth:200}}>Hạng mục</th>
              <th style={{minWidth:140}}>Loại hành động</th>
              <th style={{minWidth:70}}>Số lượng</th>
              <th className="left" style={{minWidth:160}}>Người thực hiện</th>
              <th className="left" style={{minWidth:200}}>Ghi chú / Minh chứng</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{padding:40, textAlign:"center", color:"var(--t3)"}}>Chưa có hoạt động nào</td></tr>
            ) : filtered.map(log => (
              <tr key={log.id}>
                <td style={{fontSize:11}}>
                  <div>{fmtDisplay(log.date)}</div>
                  <div style={{color:"var(--t3)", fontSize:10}}>{log.time || "—"}</div>
                </td>
                <td className="left" style={{fontWeight:500, fontSize:12}}>{log.projectName}</td>
                <td className="left" style={{fontSize:12}}>
                  <span className="wh-item-name">{log.itemName}</span>
                </td>
                <td>
                  <span className={`al-action ${log.action}`}>{log.actionLabel}</span>
                </td>
                <td className="pd-num" style={{fontWeight:600}}>+{r2(log.qty)} {log.unit}</td>
                <td className="left" style={{fontSize:12}}>
                  <div>{log.actorName}</div>
                  {log.actorRole && <div style={{color:"var(--t3)", fontSize:10}}>{log.actorRole}</div>}
                </td>
                <td className="left" style={{fontSize:12, color:"var(--t2)", maxWidth:300, whiteSpace:"normal", wordBreak:"break-word"}}>
                  {log.note || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmtDisplay(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
