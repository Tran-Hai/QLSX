"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Select } from "./ui/Select";
import { uid, todayStr } from "@/lib/utils";
import { TASK_TYPES, TASK_DEPT_GROUPS, getTaskTypeByDept, PRIO, DEPARTMENTS } from "@/lib/constants";

interface TaskItem {
  id: string; typeId: string; name: string; dept: string; icon: string;
  projectId: string; projectName: string; assignedTo: string; assignedName: string;
  dueDate: string; priority: string; note: string; status: string;
  completedDate: string; createdAt: string;
}
interface Project { id: string; name: string; }
interface StaffMember { id: string; name: string; }

export function TasksTab() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [viewTab, setViewTab] = useState("tatca");
  const [filter, setFilter] = useState({ dept: "", priority: "", status: "", project: "", assignedTo: "" });
  const [editing, setEditing] = useState<TaskItem | null>(null);
  const [openFilter, setOpenFilter] = useState("");

  // New task form state
  const [fType, setFType] = useState("");
  const [fDept, setFDept] = useState("");
  const [fPriority, setFPriority] = useState("normal");
  const [fProject, setFProject] = useState("");
  const [fDueDate, setFDueDate] = useState(todayStr());
  const [fNote, setFNote] = useState("");
  const [fTypeErr, setFTypeErr] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/tasks").then(r=>r.json()),
      fetch("/api/projects").then(r=>r.json()),
      fetch("/api/staff").then(r=>r.json()),
    ]).then(([t, p, s]) => { setTasks(t); setProjects(p); setStaff(s); }).catch(()=>{});
  }, []);
  useEffect(load, [load]);

  // Filter & tab logic
  const filtered = useMemo(() => {
    let list = [...tasks];
    if (viewTab === "homnay") {
      const today = todayStr();
      list = list.filter(t => t.dueDate === today);
    } else if (viewTab === "saptoi") {
      const today = todayStr();
      list = list.filter(t => t.dueDate && t.dueDate >= today && t.status !== "done");
    }
    if (filter.dept) list = list.filter(t => t.dept === filter.dept);
    if (filter.priority) list = list.filter(t => t.priority === filter.priority);
    if (filter.status) list = list.filter(t => t.status === filter.status);
    if (filter.project) list = list.filter(t => t.projectId === filter.project);
    if (filter.assignedTo) list = list.filter(t => t.assignedTo === filter.assignedTo);
    return list;
  }, [tasks, viewTab, filter]);

  const save = async (t: TaskItem) => {
    await fetch("/api/tasks", {
      method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(t),
    });
    setEditing(null);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Xoá công tác này?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  };

  const submitTask = async () => {
    if (!fType) { setFTypeErr(true); return; }
    setFTypeErr(false);
    const t = TASK_TYPES.find(x => x.id === fType);
    const p = projects.find(x => x.id === fProject);
    const dept = t?.dept || fDept || "ql";
    await fetch("/api/tasks", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        id: uid(), typeId: fType, name: t?.label || "", dept, icon: t?.icon || "📌",
        projectId: fProject, projectName: p?.name || "",
        assignedTo: "", assignedName: "", dueDate: fDueDate,
        priority: fPriority, note: fNote, status: "todo",
        completedDate: "", createdAt: todayStr(),
      }),
    });
    setFType(""); setFDept(""); setFPriority("normal"); setFProject("");
    setFDueDate(todayStr()); setFNote("");
    load();
  };

  const groupedTypes = useMemo(() => {
    return TASK_DEPT_GROUPS.map(g => ({
      ...g,
      types: getTaskTypeByDept(g.id),
    }));
  }, []);

  const priorityDot = (p: string) => {
    const c = p === "normal" ? "🔵" : p === "high" ? "🔴" : "🟢";
    return c;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; cls: string; dot: string }> = {
      todo: { label: "Chưa làm", cls: "", dot: "⚪" },
      doing: { label: "Đang làm", cls: "bi", dot: "🔵" },
      done: { label: "Hoàn thành", cls: "bg", dot: "✅" },
      issue: { label: "Có vấn đề", cls: "bw", dot: "⚠️" },
    };
    const m = map[s] || map.todo;
    return <span className={`badge ${m.cls}`}><span style={{fontSize:10}}>{m.dot}</span> {m.label}</span>;
  };

  const tabs = [
    { id: "homnay", icon: "📅", label: "Hôm nay" },
    { id: "saptoi", icon: "🗓️", label: "Sắp tới" },
    { id: "tatca", icon: "📋", label: "Tất cả" },
    { id: "theoduan", icon: "🏗️", label: "Theo dự án" },
    { id: "theonguoi", icon: "👤", label: "Theo người" },
  ];

  return (
    <div>
      <h2 className="mb-16">Công tác</h2>

      {/* ===== GIAO VIỆC MỚI FORM ===== */}
      <div className="ts-form">
        <div className="ts-form-header">
          <span className="ts-pin">📌</span> Giao việc mới
        </div>
        <div className="ts-form-body">
          <div className="ts-grid">
            <div>
              <label>Loại công tác <span className="ts-req">*</span></label>
              <Select value={fType} onChange={e => { setFType(e.target.value); setFTypeErr(false); }}
                style={{borderColor: fTypeErr ? "var(--red)" : undefined}}>
                <option value="">-- Chọn loại công tác --</option>
                {groupedTypes.map(g => (
                  <optgroup key={g.id} label={`— ${g.label} —`}>
                    {g.types.map(t => (
                      <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              {fTypeErr && <div style={{color:"var(--red)", fontSize:11, marginTop:4}}>Vui lòng chọn loại công tác</div>}
            </div>
            <div>
              <label>Giao cho</label>
              <Select value={fDept} onChange={e => setFDept(e.target.value)}>
                <option value="">— Chưa phân công —</option>
                {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </Select>
            </div>
            <div>
              <label>Mức độ ưu tiên</label>
              <Select value={fPriority} onChange={e => setFPriority(e.target.value)}>
                {Object.entries(PRIO).map(([k, v]) => (
                  <option key={k} value={k}>{v.dot} {v.l}</option>
                ))}
              </Select>
            </div>
            <div>
              <label>Công trình</label>
              <Select value={fProject} onChange={e => setFProject(e.target.value)}>
                <option value="">— Chung / Nội bộ —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div>
              <label>Ngày cần xong</label>
              <input type="date" value={fDueDate} onChange={e => setFDueDate(e.target.value)}
                style={{padding:"10px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"var(--radius-sm)", color:"var(--text)", width:"100%", fontSize:13}} />
            </div>
            <div>
              <label>Ghi chú</label>
              <input type="text" value={fNote} onChange={e => setFNote(e.target.value)}
                placeholder="Yêu cầu chi tiết..."
                style={{padding:"10px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"var(--radius-sm)", color:"var(--text)", width:"100%", fontSize:13}} />
            </div>
          </div>
          <div className="ts-actions">
            <Button onClick={submitTask}>✓ Giao việc</Button>
            <Button variant="ghost" onClick={() => { setFType(""); setFDept(""); setFPriority("normal"); setFProject(""); setFDueDate(todayStr()); setFNote(""); setFTypeErr(false); }}>Hủy</Button>
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="tab-inline" style={{marginBottom:16}}>
        {tabs.map(t => (
          <button key={t.id} className={`tab-inline-btn ${viewTab === t.id ? "active" : ""}`}
            onClick={() => setViewTab(t.id)}>
            <span style={{marginRight:6}}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ===== COMPACT FILTER BAR ===== */}
      {viewTab === "tatca" && (
      <div className="ts-filter-bar">
        {([["project", "🏗️", "Dự án", [
          { value: "", label: "Tất cả" },
          ...projects.map(p => ({ value: p.id, label: p.name })),
        ]], ["assignedTo", "👤", "Người", [
          { value: "", label: "Tất cả" },
          ...staff.map(s => ({ value: s.id, label: s.name })),
        ]], ["status", "📋", "TT", [
          { value: "", label: "Tất cả" },
          { value: "todo", label: "⚪ Chưa làm" },
          { value: "doing", label: "🔵 Đang làm" },
          { value: "done", label: "✅ Hoàn thành" },
          { value: "issue", label: "⚠️ Có vấn đề" },
        ]], ["dept", "🏢", "PB", [
          { value: "", label: "Tất cả" },
          ...DEPARTMENTS.map(d => ({ value: d.id, label: d.label })),
        ]]] as const).map(([key, icon, abbr, opts]) => {
          const val = filter[key as keyof typeof filter] as string;
          const active = !!val;
          const label = active ? opts.find(o => o.value === val)?.label || abbr : abbr;
          return (
            <div key={key} className="tsf-chip" style={{position:"relative"}}
              onClick={() => setOpenFilter(openFilter === key ? "" : key)}>
              <span>{icon}</span> {label} <span className="tsf-arrow">▾</span>
              {openFilter === key && (
                <div className="tsf-dropdown" onClick={e => e.stopPropagation()}>
                  {opts.map(o => (
                    <button key={o.value}
                      className={`tsf-opt ${val === o.value ? "sel" : ""}`}
                      onClick={() => { setFilter(f => ({ ...f, [key]: o.value })); setOpenFilter(""); }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {(filter.project || filter.assignedTo || filter.status || filter.dept) && (
          <button className="tsf-clear"
            onClick={() => setFilter({dept:"", priority:"", status:"", project:"", assignedTo:""})}>
            ↺
          </button>
        )}
      </div>
      )}

      {/* ===== TASK LIST ===== */}
      <div className="ts-grid-2col">
        {filtered.map(t => {
          const typeDef = TASK_TYPES.find(x => x.id === t.typeId);
          const deptLabel = DEPARTMENTS.find(d => d.id === t.dept)?.label || t.dept;
          return (
            <div key={t.id} className="ts-task-card" onClick={() => setEditing(t)}>
              <div className="tsc-top">
                <div className="tsc-title">
                  <span className="tsc-icon">{typeDef?.icon || t.icon || "📌"}</span>
                  {t.name || "(chưa có tên)"}
                </div>
                <span style={{fontSize:12, color: PRIO[t.priority]?.c, fontWeight:600, whiteSpace:"nowrap"}}>
                  {priorityDot(t.priority)} {PRIO[t.priority]?.l}
                </span>
              </div>
              <div className="tsc-meta">
                {t.projectName && <span>🏗️ {t.projectName}</span>}
                {t.assignedName && <span>👤 {t.assignedName}</span>}
                {t.dueDate && <span>📅 {t.dueDate}</span>}
                {t.note && <span style={{fontStyle:"italic"}}>📝 {t.note}</span>}
              </div>
              <div className="tsc-bottom">
                {statusBadge(t.status)}
                <span className="tsc-dept">{deptLabel}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{gridColumn:"1/-1", textAlign:"center", padding:60, color:"var(--t3)"}}>
            <div style={{fontSize:48, opacity:0.4, marginBottom:12}}>📋</div>
            <div>Không có công việc phù hợp.</div>
          </div>
        )}
      </div>

      {/* ===== EDIT MODAL ===== */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.name || "Công tác"} wide>
        {editing && (
          <div className="frm">
            <div>
              <label>Tên công tác</label>
              <input type="text" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nhập tên công tác" />
            </div>
            <div className="g2">
              <div>
                <label>Loại</label>
                <Select value={editing.typeId} onChange={e => setEditing({...editing, typeId: e.target.value})}>
                  {TASK_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </Select>
              </div>
              <div>
                <label>Phòng ban</label>
                <Select value={editing.dept} onChange={e => setEditing({...editing, dept: e.target.value})}>
                  {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </Select>
              </div>
            </div>
            <div className="g2">
              <div>
                <label>Ưu tiên</label>
                <Select value={editing.priority} onChange={e => setEditing({...editing, priority: e.target.value})}>
                  {Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v.dot} {v.l}</option>)}
                </Select>
              </div>
              <div>
                <label>Trạng thái</label>
                <Select value={editing.status} onChange={e => setEditing({...editing, status: e.target.value})}>
                  <option value="todo">⚪ Chưa làm</option>
                  <option value="doing">🔵 Đang làm</option>
                  <option value="done">✅ Hoàn thành</option>
                  <option value="issue">⚠️ Có vấn đề</option>
                </Select>
              </div>
            </div>
            <div className="g2">
              <div>
                <label>Công trình</label>
                <Select value={editing.projectId} onChange={e => {
                  const p = projects.find(x => x.id === e.target.value);
                  setEditing({...editing, projectId: e.target.value, projectName: p?.name || ""});
                }}>
                  <option value="">-- Chọn --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </div>
              <div>
                <label>Người làm</label>
                <Select value={editing.assignedTo} onChange={e => {
                  const s = staff.find(x => x.id === e.target.value);
                  setEditing({...editing, assignedTo: e.target.value, assignedName: s?.name || ""});
                }}>
                  <option value="">-- Chọn --</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </div>
            </div>
            <div className="g2">
              <div>
                <label>Hạn</label>
                <input type="date" value={editing.dueDate} onChange={e => setEditing({...editing, dueDate: e.target.value})} />
              </div>
            </div>
            <div>
              <label>Ghi chú</label>
              <textarea value={editing.note} onChange={e => setEditing({...editing, note: e.target.value})} placeholder="Nhập ghi chú" />
            </div>
            <div className="frm-actions">
              <Button variant="ghost" onClick={() => setEditing(null)}>Huỷ</Button>
              {editing.id && <Button variant="danger" onClick={() => { del(editing.id); setEditing(null); }}>Xoá</Button>}
              <Button onClick={() => save(editing)}>Lưu</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
