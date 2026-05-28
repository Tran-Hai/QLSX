"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "./ui/Button";
import { uid, todayStr } from "@/lib/utils";
import { INST_ITEMS } from "@/lib/constants";

interface Project { id: string; name: string; instCfg: Record<string,number>; }
interface InstLog { id: string; date: string; projectId: string; projectName: string; itemId: string; itemName: string; unit: string; qty: number; note: string; techStatus: string; techNote: string; }
interface KhoEntry { id: string; projectId: string; itemId: string; qty: number; }

function r2(v: number) { return Math.round(v * 100) / 100; }
function fmtDisplay(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function InstallationTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [instLogs, setInstLogs] = useState<InstLog[]>([]);
  const [khoEntries, setKhoEntries] = useState<KhoEntry[]>([]);
  const [date, setDate] = useState(todayStr());
  const [formQtys, setFormQtys] = useState<Record<string,string>>({});
  const [formStatuses, setFormStatuses] = useState<Record<string,string>>({});
  const [formNotes, setFormNotes] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState<Record<string,boolean>>({});
  const [valErrors, setValErrors] = useState<Record<string,string>>({});

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/projects").then(r=>r.json()),
      fetch("/api/inst_logs").then(r=>r.json()),
      fetch("/api/kho_entries").then(r=>r.json()),
    ]).then(([p, il, k]) => {
      setProjects(p); setInstLogs(il); setKhoEntries(k);
    }).catch(()=>{});
  }, []);
  useEffect(load, [load]);

  const navDate = (d: string, delta: number) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + delta);
    return dt.toISOString().slice(0, 10);
  };

  const groups = useMemo(() => {
    const result: { project: Project; rows: {
      key: string; itemId: string; itemName: string; unit: string;
      target: number; khoQty: number; todayQty: number; totalInst: number; remaining: number;
      pctDone: number; isBlocked: boolean; todayEntry?: InstLog;
    }[] }[] = [];

    for (const p of projects) {
      const cfg: Record<string,number> = p.instCfg || {};
      const keys = Object.keys(cfg).filter(k => INST_ITEMS.some(x => x.id === k));
      if (keys.length === 0) continue;
      const rows = keys.map(itemId => {
        const def = INST_ITEMS.find(x => x.id === itemId)!;
        const target = cfg[itemId] || 0;
        const khoQty = khoEntries
          .filter(e => e.projectId === p.id && e.itemId === itemId)
          .reduce((s, e) => s + e.qty, 0);
        const totalInst = instLogs
          .filter(l => l.projectId === p.id && l.itemId === itemId)
          .reduce((s, l) => s + l.qty, 0);
        const todayQty = instLogs
          .filter(l => l.projectId === p.id && l.itemId === itemId && l.date === date)
          .reduce((s, l) => s + l.qty, 0);
        const todayEntry = instLogs.find(l => l.projectId === p.id && l.itemId === itemId && l.date === date);
        const remaining = Math.max(0, target - totalInst);
        const pctDone = target > 0 ? Math.min(100, (totalInst / target) * 100) : 0;
        const isBlocked = khoQty <= 0;
        const key = `${p.id}:${itemId}`;
        return { key, itemId, itemName: def.label, unit: def.unit, target, khoQty, todayQty, totalInst, remaining, pctDone, isBlocked, todayEntry };
      });
      result.push({ project: p, rows });
    }
    return result;
  }, [projects, instLogs, khoEntries, date]);

  const waitingCount = useMemo(() => {
    let c = 0;
    for (const g of groups) for (const r of g.rows) if (r.isBlocked && r.remaining > 0) c++;
    return c;
  }, [groups]);

  const save = async (key: string) => {
    const qty = parseFloat(formQtys[key] || "0");
    if (qty <= 0) return;
    const status = formStatuses[key] || "";
    const note = formNotes[key] || "";

    if (status === "chua_dat" && !note.trim()) {
      setValErrors(prev => ({ ...prev, [key]: "Cần mô tả lỗi để làm lại" }));
      return;
    }
    setValErrors(prev => ({ ...prev, [key]: "" }));

    const [projectId, itemId] = key.split(":");
    const p = projects.find(x => x.id === projectId);
    const def = INST_ITEMS.find(x => x.id === itemId);
    if (!p || !def) return;

    const saveKey = `save:${key}`;
    setSaving(prev => ({ ...prev, [saveKey]: true }));
    try {
      const stableId = `inst-${projectId}-${itemId}-${date}`;
      await fetch("/api/inst_logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: stableId, date, projectId, projectName: p.name,
          itemId, itemName: def.label, unit: def.unit,
          qty, note: "", techStatus: status, techNote: note,
          createdAt: todayStr(),
        }),
      });
      setFormQtys(prev => ({ ...prev, [key]: "" }));
      await load();
    } finally {
      setSaving(prev => ({ ...prev, [saveKey]: false }));
    }
  };

  const statusOpts = (key: string, isBlocked: boolean) => {
    if (isBlocked) return <span className="il-locked" style={{color:"var(--red)", fontSize:11, fontWeight:600}}>⚠️ Chờ kho</span>;
    const val = formStatuses[key] ?? "";
    return (
      <select className="il-sel" value={val} onChange={e => setFormStatuses(prev => ({ ...prev, [key]: e.target.value }))}>
        <option value="">—</option>
        <option value="dat">✅ Đạt</option>
        <option value="chua_dat">❌ Chưa đạt</option>
      </select>
    );
  };

  return (
    <div>
      <h2 className="mb-16">Lắp đặt & Đánh giá kỹ thuật</h2>

      <div className="cal-toolbar">
        <Button size="sm" variant="ghost" onClick={() => setDate(navDate(date, -1))}>◀</Button>
        <span className="ct-label">📅 {fmtDisplay(date)}</span>
        <Button size="sm" variant="ghost" onClick={() => setDate(navDate(date, 1))}>▶</Button>
        <Button size="sm" variant="ghost" onClick={() => setDate(todayStr())}>Hôm nay</Button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{maxWidth:160}} />
        {waitingCount > 0 && (
          <span className="wp-badge warn" style={{marginLeft:"auto"}}>⚠️ Chờ kho: {waitingCount}</span>
        )}
      </div>

      <div className="pd-panel">
        <div className="pd-title">📋 Sau khi ghi khối lượng, cần chọn Đánh giá kỹ thuật. Nếu chưa đạt → mô tả để làm lại.</div>

        {groups.length === 0 ? (
          <div className="pd-empty">
            <div style={{fontSize:48, opacity:0.4, marginBottom:12}}>🔧</div>
            <div>Chưa có hạng mục lắp đặt. Thêm cấu hình lắp đặt trong Công trình.</div>
          </div>
        ) : (
          <div style={{overflowX:"auto"}}>
            <table className="pd-table">
              <thead>
                <tr>
                  <th className="left" style={{minWidth:160}}>Công trình</th>
                  <th className="left" style={{minWidth:160}}>Hạng mục</th>
                  <th style={{minWidth:40}}>ĐVT</th>
                  <th style={{minWidth:55}}>Kho</th>
                  <th style={{minWidth:55}}>Hôm nay</th>
                  <th style={{minWidth:55}}>Đã LĐ</th>
                  <th style={{minWidth:55}}>Còn</th>
                  <th style={{minWidth:120}}>Tiến độ</th>
                  <th style={{minWidth:140}} colSpan={2}>Ghi KL</th>
                  <th style={{minWidth:130}}>Đánh giá KT</th>
                  <th style={{minWidth:160}}>Ghi chú / Yêu cầu LẠI</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => (
                  <tr key={g.project.id} className="pd-group-header">
                    <td colSpan={12} className="left">
                      <span className="pd-ct-name">{g.project.name.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
                {groups.flatMap(g =>
                  g.rows.map((row, ri) => {
                    const saveKey = `save:${row.key}`;
                    const isSaving = saving[saveKey];
                    const err = valErrors[row.key];
                    return (
                      <tr key={row.key}>
                        <td className="left" style={ri > 0 ? {paddingTop:4,paddingBottom:4} : {}}>
                          {ri === 0 && <span className="pd-ct-name">{g.project.name.toUpperCase()}</span>}
                        </td>
                        <td className="left"><span className="pd-item-name">{row.itemName}</span></td>
                        <td>{row.unit}</td>
                        <td>{row.khoQty > 0 ? <span className="pd-num">{row.khoQty}</span> : <span style={{color:"var(--red)"}}>—</span>}</td>
                        <td>{row.todayQty > 0 ? <span className="pd-num blue">{r2(row.todayQty)}</span> : <span style={{color:"var(--blue)", opacity:0.4}}>—</span>}</td>
                        <td className="pd-num green">{r2(row.totalInst)}</td>
                        <td className="pd-num warn">{r2(row.remaining)}</td>
                        <td>
                          <div style={{width:110, height:16, background:"rgba(255,255,255,0.06)", borderRadius:8, overflow:"hidden", margin:"0 auto"}}>
                            <div style={{width:`${row.pctDone}%`, height:"100%", background:"var(--green)", borderRadius:8, transition:"width 0.3s"}} />
                          </div>
                        </td>
                        <td>
                          {row.isBlocked ? (
                            <span style={{color:"var(--red)", fontSize:11, fontWeight:600, whiteSpace:"nowrap"}}>⚠️ Chờ kho</span>
                          ) : (
                            <input type="number" step="0.001" min="0" className="pd-input"
                              placeholder="KL..."
                              value={formQtys[row.key] ?? ""}
                              onChange={e => setFormQtys(prev => ({ ...prev, [row.key]: e.target.value }))}
                              onKeyDown={e => { if (e.key === "Enter") save(row.key); }} />
                          )}
                        </td>
                        <td>
                          {!row.isBlocked && (
                            <button className={`pd-btn-record${isSaving ? " loading" : ""}`}
                              disabled={isSaving || !(parseFloat(formQtys[row.key] || "0") > 0)}
                              onClick={() => save(row.key)}
                              title="Ghi nhận">✓</button>
                          )}
                        </td>
                        <td>{statusOpts(row.key, row.isBlocked)}</td>
                        <td>
                          {row.isBlocked ? (
                            <span style={{color:"var(--t3)", fontSize:11}}>—</span>
                          ) : (
                            <div>
                              <input type="text" className="pd-input" style={{width:"100%"}}
                                placeholder={formStatuses[row.key] === "chua_dat" ? "Mô tả lỗi..." : "Ghi chú"}
                                value={formNotes[row.key] ?? ""}
                                onChange={e => {
                                  setFormNotes(prev => ({ ...prev, [row.key]: e.target.value }));
                                  if (err) setValErrors(prev => ({ ...prev, [row.key]: "" }));
                                }} />
                              {err && <div style={{color:"var(--red)", fontSize:10, marginTop:2}}>{err}</div>}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
