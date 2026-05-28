"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Select } from "./ui/Select";
import { uid, todayStr } from "@/lib/utils";
import { TASK_TYPES, PRIO, DEPARTMENTS } from "@/lib/constants";

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
  const [filter, setFilter] = useState({ dept: "", priority: "", status: "", project: "" });
  const [editing, setEditing] = useState<TaskItem | null>(null);

  const load = () => {
    fetch("/api/tasks").then(r=>r.json()).then(setTasks).catch(()=>{});
    fetch("/api/projects").then(r=>r.json()).then(setProjects).catch(()=>{});
    fetch("/api/staff").then(r=>r.json()).then(setStaff).catch(()=>{});
  };

  useEffect(load, []);

  const filtered = tasks.filter(t => {
    if (filter.dept && t.dept !== filter.dept) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.status && t.status !== filter.status) return false;
    if (filter.project && t.projectId !== filter.project) return false;
    return true;
  });

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

  const newTask = () => {
    setEditing({
      id: uid(), typeId: "khac", name: "", dept: "ql", icon: "📌",
      projectId: "", projectName: "", assignedTo: "", assignedName: "",
      dueDate: "", priority: "normal", note: "", status: "todo",
      completedDate: "", createdAt: todayStr(),
    });
  };

  const priorityBadge = (p: string) => {
    const cls = p === "urgent" ? "br" : p === "high" ? "bw" : p === "low" ? "" : "bg";
    return <span className={`badge ${cls}`}>{PRIO[p]?.l || p}</span>;
  };

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { todo: "", doing: "bi", done: "bg" };
    const l: Record<string, string> = { todo: "Chưa", doing: "Đang", done: "Xong" };
    return <span className={`badge ${m[s]}`}>{l[s] || s}</span>;
  };

  const typeIcon = (typeId: string) => TASK_TYPES.find(t => t.id === typeId)?.label.slice(0,2) || "📌";

  return (
    <div>
      <div className="flex justify-between items-center mb-16">
        <h2>Công tác</h2>
        <Button onClick={newTask}>+ Thêm công tác</Button>
      </div>

      <div className="card mb-16">
        <div className="frm-row">
          <Select value={filter.dept} onChange={e => setFilter({...filter, dept: e.target.value})}>
            <option value="">Phòng ban</option>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </Select>
          <Select value={filter.priority} onChange={e => setFilter({...filter, priority: e.target.value})}>
            <option value="">Ưu tiên</option>
            {Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
          </Select>
          <Select value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}>
            <option value="">Trạng thái</option>
            <option value="todo">Chưa</option><option value="doing">Đang</option><option value="done">Xong</option>
          </Select>
          <Select value={filter.project} onChange={e => setFilter({...filter, project: e.target.value})}>
            <option value="">Công trình</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>
      </div>

      <div className="g2">
        {filtered.map(t => (
          <div key={t.id} className="card" style={{cursor:"pointer"}} onClick={() => setEditing(t)}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <span style={{fontSize:18, marginRight:8}}>{typeIcon(t.typeId)}</span>
                <strong>{t.name || "(chưa có tên)"}</strong>
              </div>
              {priorityBadge(t.priority)}
            </div>
            <div className="flex flex-wrap gap-8 text-sm text-t2">
              {t.projectName && <span>🏗️ {t.projectName}</span>}
              {t.assignedName && <span>👤 {t.assignedName}</span>}
              {t.dueDate && <span>📅 {t.dueDate}</span>}
            </div>
            <div className="flex justify-between items-center mt-12">
              {statusBadge(t.status)}
              <span className="text-xs text-t2">{DEPARTMENTS.find(d => d.id === t.dept)?.label || t.dept}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card text-center text-t2" style={{gridColumn:"1/-1", padding:40}}>
            Không có công tác nào
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.name || "Thêm công tác"}>
        {editing && (
          <div className="frm">
            <div>
              <label>Tên công tác</label>
              <input type="text" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Nhập tên công tác" />
            </div>
            <div>
              <label>Loại</label>
              <Select value={editing.typeId} onChange={e => {
                const t = TASK_TYPES.find(x => x.id === e.target.value);
                setEditing({...editing, typeId: e.target.value, icon: t?.label.slice(0,2) || "📌"});
              }}>
                {TASK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </div>
            <div className="g2">
              <div>
                <label>Phòng ban</label>
                <Select value={editing.dept} onChange={e => setEditing({...editing, dept: e.target.value})}>
                  {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </Select>
              </div>
              <div>
                <label>Ưu tiên</label>
                <Select value={editing.priority} onChange={e => setEditing({...editing, priority: e.target.value})}>
                  {Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v.l}</option>)}
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
              <div>
                <label>Trạng thái</label>
                <Select value={editing.status} onChange={e => setEditing({...editing, status: e.target.value})}>
                  <option value="todo">Chưa</option><option value="doing">Đang</option><option value="done">Xong</option>
                </Select>
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
