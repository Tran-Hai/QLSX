"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "./ui/Button";
import { uid, todayStr } from "@/lib/utils";
import { PROD_ITEMS } from "@/lib/constants";

interface Project { id: string; name: string; location: string; prodTargets: Record<string,number>; }
interface ProdLog { id: string; date: string; projectId: string; projectName: string; itemId: string; itemName: string; unit: string; qty: number; note: string; }
interface KhoEntry { id: string; date: string; projectId: string; itemId: string; qty: number; }

function r2(v: number) { return Math.round(v * 100) / 100; }

function fmtDisplay(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function ProductionTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [khoEntries, setKhoEntries] = useState<KhoEntry[]>([]);
  const [date, setDate] = useState(todayStr());
  const [inputs, setInputs] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState<Record<string,boolean>>({});

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/projects").then(r=>r.json()),
      fetch("/api/prod_logs").then(r=>r.json()),
      fetch("/api/kho_entries").then(r=>r.json()),
    ]).then(([p, pl, k]) => {
      setProjects(p); setProdLogs(pl); setKhoEntries(k);
    }).catch(()=>{});
  }, []);
  useEffect(load, [load]);

  const navDate = (d: string, delta: number) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + delta);
    return dt.toISOString().slice(0, 10);
  };

  // Build rows: for each project, for each prodTarget item (category=sx)
  const rows: {
    projectId: string; projectName: string; location: string;
    itemId: string; itemName: string; unit: string;
    target: number; totalProd: number; todayProd: number; remaining: number;
    khoRecorded: boolean;
  }[] = [];

  for (const p of projects) {
    const targets: Record<string,number> = p.prodTargets || {};
    for (const [itemId, target] of Object.entries(targets)) {
      const def = PROD_ITEMS.find(x => x.id === itemId);
      if (!def) continue;
      const totalProd = prodLogs
        .filter(l => l.projectId === p.id && l.itemId === itemId)
        .reduce((s, l) => s + l.qty, 0);
      const todayProd = prodLogs
        .filter(l => l.projectId === p.id && l.itemId === itemId && l.date === date)
        .reduce((s, l) => s + l.qty, 0);
      const remaining = Math.max(0, target - totalProd);
      const khoQty = khoEntries
        .filter(e => e.projectId === p.id && e.itemId === itemId && e.date === date)
        .reduce((s, e) => s + e.qty, 0);
      rows.push({
        projectId: p.id, projectName: p.name, location: p.location,
        itemId, itemName: def.label, unit: def.unit,
        target, totalProd, todayProd, remaining,
        khoRecorded: khoQty >= todayProd && todayProd > 0,
      });
    }
  }

  // Group rows by project
  const groups: { projectId: string; projectName: string; location: string; rows: typeof rows }[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (!seen.has(r.projectId)) {
      seen.add(r.projectId);
      groups.push({ projectId: r.projectId, projectName: r.projectName, location: r.location, rows: [] });
    }
    const g = groups.find(g => g.projectId === r.projectId)!;
    g.rows.push(r);
  }

  const todayTotal = rows.reduce((s, r) => s + r.todayProd, 0);

  const saveProd = async (itemId: string, itemName: string, unit: string) => {
    const qty = parseFloat(inputs[itemId] || "0");
    if (qty <= 0) return;
    const proj = projects.find(p => p.id === rows.find(r => r.itemId === itemId)?.projectId);
    if (!proj) return;
    const key = `prod:${itemId}`;
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await fetch("/api/prod_logs", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          id: uid(), date, projectId: proj.id, projectName: proj.name,
          itemId, itemName, unit, qty, note: "", createdAt: todayStr(),
        }),
      });
      setInputs(prev => ({ ...prev, [itemId]: "" }));
      await load();
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  const doNhapKho = async (itemId: string) => {
    const proj = projects.find(p => p.id === rows.find(r => r.itemId === itemId)?.projectId);
    if (!proj) return;
    const todayProd = prodLogs
      .filter(l => l.projectId === proj.id && l.itemId === itemId && l.date === date)
      .reduce((s, l) => s + l.qty, 0);
    if (todayProd <= 0) return;
    const key = `kho:${itemId}`;
    setSaving(prev => ({ ...prev, [key]: true }));
    try {
      await fetch("/api/kho_entries", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ id: uid(), date, projectId: proj.id, itemId, qty: todayProd, createdAt: todayStr() }),
      });
      await load();
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div>
      <h2 className="mb-16">Sản xuất & Nhập kho</h2>

      {/* HEADER */}
      <div className="cal-toolbar">
        <Button size="sm" variant="ghost" onClick={() => setDate(navDate(date, -1))}>◀</Button>
        <span className="ct-label">📅 {fmtDisplay(date)}</span>
        <Button size="sm" variant="ghost" onClick={() => setDate(navDate(date, 1))}>▶</Button>
        <Button size="sm" variant="ghost" onClick={() => setDate(todayStr())}>Hôm nay</Button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{maxWidth:160}} />
        <span className="wp-badge blue" style={{marginLeft:"auto"}}>
          🛠 SX hôm nay: {r2(todayTotal)} đv
        </span>
      </div>

      {/* MAIN PANEL */}
      <div className="pd-panel">
        <div className="pd-title">
          Ghi KL sản xuất xong → bấm <strong>✓</strong> → Ghi nhận. Sau đó bấm → <strong>Nhập kho</strong> để chuyển hàng đã SX vào kho.
        </div>

        {rows.length === 0 ? (
          <div className="pd-empty">
            <div style={{fontSize:48, opacity:0.4, marginBottom:12}}>🏭</div>
            <div>Chưa có kế hoạch sản xuất. Thêm mục tiêu sản xuất trong Công trình để bắt đầu.</div>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.projectId} className="card mb-16">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <span className="font-bold" style={{color:"var(--blue)", fontSize:15}}>{group.projectName}</span>
                  {group.location && (
                    <span className="text-t2" style={{marginLeft:12, fontSize:12}}>
                      📍 {group.location}
                    </span>
                  )}
                </div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table className="pd-table" style={{minWidth:800}}>
                  <thead>
                    <tr>
                      <th className="left" style={{minWidth:140}}>Hạng mục</th>
                      <th style={{minWidth:45}}>ĐVT</th>
                      <th style={{minWidth:60}}>KL cần</th>
                      <th style={{minWidth:70}}>Tổng đã SX</th>
                      <th style={{minWidth:65}}>Hôm nay</th>
                      <th style={{minWidth:65}}>Còn lại</th>
                      <th style={{minWidth:140}} colSpan={2}>Ghi nhận hôm nay</th>
                      <th style={{minWidth:120}}>Nhập kho (SX → kho)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, ri) => {
                      const inputKey = `prod:${row.itemId}`;
                      const khoKey = `kho:${row.itemId}`;
                      const isSaving = saving[inputKey];
                      const isKhoSaving = saving[khoKey];
                      return (
                        <tr key={`${row.projectId}-${row.itemId}`}>
                          <td className="left">
                            <span className="pd-item-name">{row.itemName}</span>
                          </td>
                          <td>{row.unit}</td>
                          <td className="pd-num">{row.target}</td>
                          <td className="pd-num green">{r2(row.totalProd)}</td>
                          <td className="pd-num blue">{r2(row.todayProd)}</td>
                          <td className="pd-num warn">{r2(row.remaining)}</td>
                          <td>
                            <div className="pd-input-wrap">
                              <input type="number" step="0.001" min="0"
                                className="pd-input"
                                placeholder="SX..."
                                value={inputs[row.itemId] ?? ""}
                                onChange={e => setInputs(prev => ({ ...prev, [row.itemId]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === "Enter") saveProd(row.itemId, row.itemName, row.unit);
                                }} />
                            </div>
                          </td>
                          <td>
                            <button className={`pd-btn-record${isSaving ? " loading" : ""}`}
                              disabled={isSaving || !(parseFloat(inputs[row.itemId] || "0") > 0)}
                              onClick={() => saveProd(row.itemId, row.itemName, row.unit)}
                              title="Ghi nhận">✓</button>
                          </td>
                          <td>
                            {row.khoRecorded ? (
                              <span className="pd-kho-done">
                                <span className="pd-kho-check">✓</span> Đã nhập kho
                              </span>
                            ) : row.todayProd > 0 ? (
                              <button className="pd-kho-btn"
                                disabled={isKhoSaving}
                                onClick={() => doNhapKho(row.itemId)}>
                                {isKhoSaving ? "⏳" : "Nhập kho"}
                              </button>
                            ) : (
                              <span style={{color:"var(--t3)", fontSize:11}}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
