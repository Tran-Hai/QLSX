"use client";

import { useEffect, useState, useMemo } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { uid, fmtDate, todayStr } from "@/lib/utils";
import { ALL_ITEMS, ROLES, KHO_INST_MAP } from "@/lib/constants";

interface Project {
  id: string; name: string; location: string;
  prodTargets: Record<string, number>;
  instCfg: Record<string, number>;
  personnel: Record<string, any>;
  sxDeadlines: Record<string, string>;
  ldDeadlines: Record<string, string>;
  prodBatches: Record<string, number>;
  createdAt: string;
}

interface StaffMember {
  id: string; name: string; role: string;
}
interface ProdLog { id: string; projectId: string; itemId: string; qty: number; }
interface InstLog { id: string; projectId: string; itemId: string; qty: number; }

export function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [instLogs, setInstLogs] = useState<InstLog[]>([]);
  const [edit, setEdit] = useState<Project | null>(null);
  const [editTab, setEditTab] = useState("chung");

  const load = () => {
    fetch("/api/projects").then(r=>r.json()).then(setProjects).catch(()=>{});
    fetch("/api/staff").then(r=>r.json()).then(setStaffList).catch(()=>{});
    fetch("/api/prod_logs").then(r=>r.json()).then(setProdLogs).catch(()=>{});
    fetch("/api/inst_logs").then(r=>r.json()).then(setInstLogs).catch(()=>{});
  };

  useEffect(load, []);

  const del = async (p: Project) => {
    if (!confirm(`Xoá công trình "${p.name}"?`)) return;
    setProjects(prev => prev.filter(x => x.id !== p.id));
    await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
    for (const tbl of ["prod_logs", "inst_logs", "kho_entries", "cong_nhat"]) {
      const all: any[] = await fetch(`/api/${tbl}`).then(r=>r.json());
      for (const row of all.filter((r: any) => r.projectId === p.id)) {
        await fetch(`/api/${tbl}/${row.id}`, { method: "DELETE" });
      }
    }
  };

  const save = async (p: Project) => {
    const exists = projects.find(x => x.id === p.id);
    if (exists) {
      setProjects(prev => prev.map(x => x.id === p.id ? p : x));
    } else {
      setProjects(prev => [...prev, p]);
    }
    setEdit(null);
    await fetch("/api/projects", {
      method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(p),
    });
  };

  const newProject = () => {
    setEdit({
      id: uid(), name: "", location: "",
      prodTargets: {}, instCfg: {}, personnel: { kt: [], tssx: "", tsld: "", cn: "" },
      sxDeadlines: {}, ldDeadlines: {}, prodBatches: {}, createdAt: todayStr(),
    });
    setEditTab("chung");
  };

  const projectProgress = useMemo(() => {
    const map: Record<string, { sxPct: number; ldPct: number; sxRemaining: number; ldRemaining: number }> = {};
    for (const p of projects) {
      const prodTargets = p.prodTargets || {};
      const instCfg = p.instCfg || {};
      let sxDone = 0; let sxTotal = 0;
      for (const [itemId, target] of Object.entries(prodTargets)) {
        const done = prodLogs.filter(l => l.projectId === p.id && l.itemId === itemId).reduce((s, l) => s + l.qty, 0);
        sxDone += done; sxTotal += target;
      }
      let ldDone = 0; let ldTotal = 0;
      for (const [itemId, target] of Object.entries(instCfg)) {
        const done = instLogs.filter(l => l.projectId === p.id && l.itemId === itemId).reduce((s, l) => s + l.qty, 0);
        ldDone += done; ldTotal += target;
      }
      map[p.id] = {
        sxPct: sxTotal > 0 ? Math.min(100, Math.round((sxDone / sxTotal) * 100)) : 0,
        ldPct: ldTotal > 0 ? Math.min(100, Math.round((ldDone / ldTotal) * 100)) : 0,
        sxRemaining: Math.max(0, sxTotal - sxDone),
        ldRemaining: Math.max(0, ldTotal - ldDone),
      };
    }
    return map;
  }, [projects, prodLogs, instLogs]);

  return (
    <div>
      <div className="flex justify-between items-center mb-16">
        <h2>Công trình</h2>
        <Button onClick={newProject}>+ Thêm công trình</Button>
      </div>
      <div className="g2">
        {projects.map((p) => {
          const pp = projectProgress[p.id] || { sxPct: 0, ldPct: 0, sxRemaining: 0, ldRemaining: 0 };
          const pColor = (v: number) => v >= 100 ? "var(--green)" : v >= 50 ? "var(--warn)" : "var(--blue)";
          return (
            <div key={p.id} className="card" style={{cursor:"pointer"}} onClick={() => { setEdit(p); setEditTab("chung"); }}>
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold">{p.name || "(chưa có tên)"}</span>
                <div className="flex gap-8">
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEdit(p); setEditTab("chung"); }}>✏️</Button>
                  <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); del(p); }}>✕</Button>
                </div>
              </div>
              <div className="text-sm text-t2 mb-8">📍 {p.location || "Chưa có địa điểm"}</div>
              <div className="text-sm mb-8">
                {Object.entries(p.personnel).map(([role, ids]) => {
                  const label = ROLES[role]?.short || role;
                  const names = (Array.isArray(ids) ? ids : [ids]).filter(Boolean).map((id: string) => staffList.find(s => s.id === id)?.name || id).join(", ");
                  return names ? <div key={role} className="mb-4"><span className="text-t2">{label}:</span> {names}</div> : null;
                })}
              </div>
              <div className="text-sm mb-8">
                <span className="text-t2">📅 SX:</span> {Object.values(p.sxDeadlines).filter(Boolean).sort().reverse()[0] || "—"}
                <span style={{marginLeft:12}}><span className="text-t2">🔧 LĐ:</span> {Object.values(p.ldDeadlines).filter(Boolean).sort().reverse()[0] || "—"}
                </span>
              </div>
              {/* SX progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-2">
                  <span>🔧 SX</span>
                  <span>{pp.sxPct}% {pp.sxRemaining > 0 ? `(còn ${pp.sxRemaining})` : "✅"}</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.06)", borderRadius:8, height:6, overflow:"hidden"}}>
                  <div style={{width:`${pp.sxPct}%`, background:pColor(pp.sxPct), height:"100%", borderRadius:8, transition:"width 0.3s ease"}} />
                </div>
              </div>
              {/* LĐ progress */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span>🔨 LĐ</span>
                  <span>{pp.ldPct}% {pp.ldRemaining > 0 ? `(còn ${pp.ldRemaining})` : "✅"}</span>
                </div>
                <div style={{background:"rgba(255,255,255,0.06)", borderRadius:8, height:6, overflow:"hidden"}}>
                  <div style={{width:`${pp.ldPct}%`, background:pColor(pp.ldPct), height:"100%", borderRadius:8, transition:"width 0.3s ease"}} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.name || "Thêm công trình"} wide>
        {edit && (
          <div>
            <div className="tab-inline">
              {["chung","nhan_su","sx","ld"].map((t) => (
                <button key={t} className={`tab-inline-btn ${editTab===t?"active":""}`} onClick={() => setEditTab(t)}>
                  {{chung:"Chung", nhan_su:"Nhân sự", sx:"SX", ld:"LĐ"}[t]}
                </button>
              ))}
            </div>

            {editTab === "chung" && (
              <div className="frm">
                <div>
                  <label>Tên công trình</label>
                  <input type="text" value={edit.name} onChange={(e) => setEdit({...edit, name: e.target.value})} placeholder="Nhập tên công trình" />
                </div>
                <div>
                  <label>Địa điểm</label>
                  <input type="text" value={edit.location} onChange={(e) => setEdit({...edit, location: e.target.value})} placeholder="Nhập địa điểm" />
                </div>
              </div>
            )}

            {editTab === "nhan_su" && (
              <div className="frm">
                {Object.entries(ROLES).map(([role, rl]) => (
                  <div key={role}>
                    <label>{rl.label}</label>
                    <Select
                      value={role==="kt" ? (Array.isArray(edit.personnel[role]) && edit.personnel[role].length ? JSON.stringify(edit.personnel[role]) : "") : (edit.personnel[role] || "")}
                      onChange={(e) => setEdit({...edit, personnel: {...edit.personnel, [role]: e.target.value ? (role==="kt" ? JSON.parse(e.target.value) : e.target.value) : (role==="kt"?[]:"")}})}>
                      <option value="">-- Chọn --</option>
                      {staffList.filter(s => s.role === role).map(s => (
                        <option key={s.id} value={role==="kt"?JSON.stringify([s.id]):s.id}>{s.name}</option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            )}

            {editTab === "sx" && (
              <div className="frm">
                {ALL_ITEMS.filter(i => i.category === "sx").map((item) => (
                  <div key={item.id} className="frm-row" style={{alignItems:"center"}}>
                    <label style={{flex:1, marginBottom:0, alignSelf:"center", fontSize:12}}>
                      {item.label}
                      <span className="dm-badge">📋 ĐM: {item.dailyOutput} {item.unit}/ng · 👷 {item.personnel} CN</span>
                    </label>
                    <input type="number" placeholder="Mục tiêu" style={{width:90}}
                      value={(edit.prodTargets as any)[item.id] || ""}
                      onChange={(e) => setEdit({
                        ...edit, prodTargets: {...edit.prodTargets, [item.id]: Number(e.target.value)},
                      })} />
                    <input type="number" placeholder="Số lô" style={{width:80}}
                      value={(edit.prodBatches as any)[item.id] || ""}
                      onChange={(e) => setEdit({
                        ...edit, prodBatches: {...edit.prodBatches, [item.id]: Number(e.target.value)},
                      })} />
                    <input type="date" style={{width:140}}
                      value={(edit.sxDeadlines as any)[item.id] || ""}
                      onChange={(e) => setEdit({
                        ...edit, sxDeadlines: {...edit.sxDeadlines, [item.id]: e.target.value},
                      })} />
                  </div>
                ))}
              </div>
            )}

            {editTab === "ld" && (
              <div className="frm">
                {ALL_ITEMS.filter(i => i.category === "ld").map((item) => (
                  <div key={item.id} className="frm-row" style={{alignItems:"center"}}>
                    <label style={{flex:1, marginBottom:0, alignSelf:"center", fontSize:12}}>
                      {item.label}
                      <span className="dm-badge">📋 ĐM: {item.dailyOutput} {item.unit}/ng · 👷 {item.personnel} CN</span>
                    </label>
                    <input type="number" placeholder="Cần lắp" style={{width:90}}
                      value={(edit.instCfg as any)[item.id] || ""}
                      onChange={(e) => setEdit({
                        ...edit, instCfg: {...edit.instCfg, [item.id]: Number(e.target.value)},
                      })} />
                    <input type="date" style={{width:140}}
                      value={(edit.ldDeadlines as any)[item.id] || ""}
                      onChange={(e) => setEdit({
                        ...edit, ldDeadlines: {...edit.ldDeadlines, [item.id]: e.target.value},
                      })} />
                  </div>
                ))}
              </div>
            )}



            <div className="frm-actions mt-16">
              <Button variant="ghost" onClick={() => setEdit(null)}>Huỷ</Button>
              <Button onClick={() => save(edit)}>Lưu thay đổi</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
