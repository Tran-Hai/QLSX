"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { uid, todayStr } from "@/lib/utils";

interface CongNhat {
  id: string; date: string; projectId: string; projectName: string;
  description: string; workers: number; hours: number; note: string; createdAt: string;
}
interface Project { id: string; name: string; }

export function DailyLaborTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<CongNhat[]>([]);
  const [selProject, setSelProject] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formWorkers, setFormWorkers] = useState("");
  const [formHours, setFormHours] = useState("8");
  const [formDate, setFormDate] = useState(todayStr());

  const load = () => {
    fetch("/api/projects").then(r=>r.json()).then(setProjects).catch(()=>{});
    fetch("/api/cong_nhat").then(r=>r.json()).then(setLogs).catch(()=>{});
  };

  useEffect(load, []);

  const add = async () => {
    const project = projects.find(p => p.id === formProject);
    if (!project || !formDesc || !formWorkers) return;
    const workers = Number(formWorkers) || 0;
    const hours = Number(formHours) || 8;
    if (workers <= 0) return;
    await fetch("/api/cong_nhat", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id: uid(), date: formDate, projectId: formProject, projectName: project.name, description: formDesc, workers, hours, note: "", createdAt: todayStr() }),
    });
    setFormDesc("");
    setFormWorkers("");
    setFormHours("8");
    load();
  };

  const del = async (id: string) => {
    await fetch(`/api/cong_nhat/${id}`, { method: "DELETE" });
    load();
  };

  const filtered = logs.filter(l => !selProject || l.projectId === selProject);
  const totalWorkers = filtered.reduce((s, l) => s + l.workers, 0);
  const totalHours = filtered.reduce((s, l) => s + l.hours * l.workers, 0);

  return (
    <div>
      <h2 className="mb-16">Công nhật</h2>

      <div className="card mb-16">
        <Select value={selProject} onChange={e => setSelProject(e.target.value)} style={{maxWidth:300}}>
          <option value="">-- Tất cả công trình --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      <div className="card mb-16">
        <h3 className="mb-12" style={{fontSize:15}}>Thêm công nhật</h3>
        <div className="frm-row">
          <div>
            <label>Công trình</label>
            <Select value={formProject} onChange={e => setFormProject(e.target.value)}>
              <option value="">-- Chọn --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <label>Ngày</label>
            <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
          </div>
          <div>
            <label>Mô tả</label>
            <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Mô tả công việc" />
          </div>
          <div>
            <label>Số công nhân</label>
            <input type="number" value={formWorkers} onChange={e => setFormWorkers(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label>Số giờ</label>
            <input type="number" value={formHours} onChange={e => setFormHours(e.target.value)} />
          </div>
          <div>
            <label>&nbsp;</label>
            <Button onClick={add}>+ Thêm</Button>
          </div>
        </div>
      </div>

      <div className="card mb-16">
        <div className="flex gap-12 mb-12">
          <div className="stat-card" style={{flex:1}}>
            <div className="icon-wrap blue">👷</div>
            <div className="info">
              <div className="num">{totalWorkers}</div>
              <div className="label">Tổng công nhân</div>
            </div>
          </div>
          <div className="stat-card" style={{flex:1}}>
            <div className="icon-wrap green">⏱</div>
            <div className="info">
              <div className="num">{totalHours}</div>
              <div className="label">Tổng giờ công</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ngày</th><th>Công trình</th><th>Mô tả</th><th style={{textAlign:"center"}}>CN</th><th style={{textAlign:"center"}}>Giờ</th><th></th></tr></thead>
            <tbody>
              {filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(l => (
                <tr key={l.id}>
                  <td>{l.date}</td>
                  <td>{l.projectName}</td>
                  <td>{l.description}</td>
                  <td style={{textAlign:"center", fontWeight:600}}>{l.workers}</td>
                  <td style={{textAlign:"center"}}>{l.hours}</td>
                  <td style={{textAlign:"right"}}><Button size="sm" variant="danger" onClick={() => del(l.id)}>✕</Button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-t2" style={{padding:20}}>Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
