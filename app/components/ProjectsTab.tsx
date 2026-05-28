"use client";

import { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { uid, fmtDate, todayStr } from "@/lib/utils";
import { PN, ROLES } from "@/lib/constants";

interface Project {
  id: string; name: string; location: string;
  prodTargets: Record<string, number>;
  instCfg: Record<string, number>;
  personnel: Record<string, any>;
  sxDeadlines: Record<string, string>;
  prodBatches: Record<string, number>;
  createdAt: string;
}

interface StaffMember {
  id: string; name: string; role: string;
}

export function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [edit, setEdit] = useState<Project | null>(null);
  const [editTab, setEditTab] = useState("chung");

  const load = () => {
    fetch("/api/projects").then(r=>r.json()).then(setProjects).catch(()=>{});
    fetch("/api/staff").then(r=>r.json()).then(setStaffList).catch(()=>{});
  };

  useEffect(load, []);

  const del = async (p: Project) => {
    if (!confirm(`Xoá công trình "${p.name}"?`)) return;
    await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
    for (const tbl of ["prod_logs", "inst_logs", "kho_entries", "cong_nhat"]) {
      const all: any[] = await fetch(`/api/${tbl}`).then(r=>r.json());
      for (const row of all.filter((r: any) => r.projectId === p.id)) {
        await fetch(`/api/${tbl}/${row.id}`, { method: "DELETE" });
      }
    }
    load();
  };

  const save = async (p: Project) => {
    await fetch("/api/projects", {
      method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(p),
    });
    setEdit(null);
    load();
  };

  const newProject = () => {
    setEdit({
      id: uid(), name: "", location: "",
      prodTargets: {}, instCfg: {}, personnel: { kt: [], tssx: "", tsld: "" },
      sxDeadlines: {}, prodBatches: {}, createdAt: todayStr(),
    });
    setEditTab("chung");
  };

  const calcProgress = (p: Project) => {
    const totalBatch = Object.values(p.prodBatches).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    const totalTarget = Object.values(p.prodTargets).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    if (totalTarget > 0) return Math.min(100, Math.round((totalBatch / totalTarget) * 100));
    return 0;
  };

  const progressColor = (v: number) => v >= 100 ? "var(--green)" : v >= 50 ? "var(--warn)" : "var(--blue)";

  return (
    <div>
      <div className="flex justify-between items-center mb-16">
        <h2>Công trình</h2>
        <Button onClick={newProject}>+ Thêm công trình</Button>
      </div>
      <div className="g2">
        {projects.map((p) => {
          const progress = calcProgress(p);
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
              <div className="text-sm text-t2 mb-8">
                📅 {Object.values(p.sxDeadlines).filter(Boolean).sort().reverse()[0] || "Không có deadline"}
              </div>
              <div style={{background:"rgba(255,255,255,0.06)", borderRadius:8, height:6, overflow:"hidden", position:"relative"}}>
                <div style={{width:`${progress}%`, background:progressColor(progress), height:"100%", borderRadius:8, transition:"width 0.3s ease"}} />
              </div>
              <div className="text-xs text-t2 mt-4 text-center">{progress}%</div>
            </div>
          );
        })}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.name || "Thêm công trình"} wide>
        {edit && (
          <div>
            <div className="tab-inline">
              {["chung","nhan_su","sx","ld","deadline"].map((t) => (
                <button key={t} className={`tab-inline-btn ${editTab===t?"active":""}`} onClick={() => setEditTab(t)}>
                  {{chung:"Chung", nhan_su:"Nhân sự", sx:"SX", ld:"LĐ", deadline:"Deadline"}[t]}
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
                    <Select value={JSON.stringify(edit.personnel[role] || "")}
                      onChange={(e) => setEdit({...edit, personnel: {...edit.personnel, [role]: e.target.value ? JSON.parse(e.target.value) : (role==="kt"?[]:"")}})}>
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
                {PN.map((item) => (
                  <div key={item.id} className="frm-row" style={{alignItems:"center"}}>
                    <label style={{flex:1, marginBottom:0, alignSelf:"center"}}>{item.label}</label>
                    <input type="number" placeholder="Mục tiêu" style={{width:120}}
                      value={(edit.prodTargets as any)[item.id] || ""}
                      onChange={(e) => setEdit({
                        ...edit, prodTargets: {...edit.prodTargets, [item.id]: Number(e.target.value)},
                      })} />
                    <input type="number" placeholder="Số lô" style={{width:100}}
                      value={(edit.prodBatches as any)[item.id] || ""}
                      onChange={(e) => setEdit({
                        ...edit, prodBatches: {...edit.prodBatches, [item.id]: Number(e.target.value)},
                      })} />
                  </div>
                ))}
              </div>
            )}

            {editTab === "ld" && (
              <div className="frm">
                {PN.map((item) => (
                  <div key={item.id} className="frm-row" style={{alignItems:"center"}}>
                    <label style={{flex:1, marginBottom:0, alignSelf:"center"}}>{item.label}</label>
                    <input type="number" placeholder="Cần lắp" style={{width:120}}
                      value={(edit.instCfg as any)[item.id] || ""}
                      onChange={(e) => setEdit({
                        ...edit, instCfg: {...edit.instCfg, [item.id]: Number(e.target.value)},
                      })} />
                  </div>
                ))}
              </div>
            )}

            {editTab === "deadline" && (
              <div className="frm">
                {PN.map((item) => (
                  <div key={item.id} className="frm-row" style={{alignItems:"center"}}>
                    <label style={{flex:1, marginBottom:0, alignSelf:"center"}}>{item.label}</label>
                    <input type="date" style={{width:160}}
                      value={(edit.sxDeadlines as any)[item.id] || ""}
                      onChange={(e) => setEdit({
                        ...edit, sxDeadlines: {...edit.sxDeadlines, [item.id]: e.target.value},
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
