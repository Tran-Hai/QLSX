"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { uid, todayStr } from "@/lib/utils";
import { PN } from "@/lib/constants";

interface InstLog {
  id: string; date: string; projectId: string; projectName: string;
  itemId: string; itemName: string; unit: string; qty: number;
  note: string; techStatus: string; techNote: string;
}
interface ProjectExtended { id: string; name: string; instCfg: Record<string, number>; }

export function InstallationTab() {
  const [projects, setProjects] = useState<ProjectExtended[]>([]);
  const [instLogs, setInstLogs] = useState<InstLog[]>([]);
  const [selProject, setSelProject] = useState("");
  const [date, setDate] = useState(todayStr());

  const load = () => {
    fetch("/api/projects").then(r=>r.json()).then(setProjects).catch(()=>{});
    fetch("/api/inst_logs").then(r=>r.json()).then(setInstLogs).catch(()=>{});
  };

  useEffect(load, []);

  const project = projects.find(p => p.id === selProject);
  const cfg = project?.instCfg || {};

  const getTotalQty = (itemId: string) => {
    return instLogs.filter(l => l.projectId === selProject && l.itemId === itemId).reduce((s, l) => s + l.qty, 0);
  };

  const save = async (itemId: string, itemName: string, unit: string) => {
    if (!selProject || !project) return;
    const qty = Number((document.getElementById(`inst-qty-${itemId}`) as HTMLInputElement).value) || 0;
    const techStatus = (document.getElementById(`inst-status-${itemId}`) as HTMLSelectElement).value;
    const techNote = (document.getElementById(`inst-note-${itemId}`) as HTMLInputElement).value;
    if (qty <= 0) return;
    await fetch("/api/inst_logs", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id: uid(), date, projectId: selProject, projectName: project.name, itemId, itemName, unit, qty, note: "", techStatus, techNote, createdAt: todayStr() }),
    });
    (document.getElementById(`inst-qty-${itemId}`) as HTMLInputElement).value = "";
    (document.getElementById(`inst-note-${itemId}`) as HTMLInputElement).value = "";
    load();
  };

  const itemList = Object.keys(cfg).length > 0
    ? Object.keys(cfg).map(id => ({ id, item: PN.find(p => p.id === id) }))
    : PN.map(p => ({ id: p.id, item: p }));

  return (
    <div>
      <h2 className="mb-16">Lắp đặt</h2>
      <div className="card mb-16">
        <div className="frm-row">
          <div>
            <label>Công trình</label>
            <Select value={selProject} onChange={e => setSelProject(e.target.value)}>
              <option value="">-- Chọn công trình --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <label>Ngày</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {!project ? (
        <div className="card text-center text-t2" style={{padding:40}}>Vui lòng chọn công trình</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hạng mục</th>
                  <th style={{textAlign:"center"}}>Cần lắp</th>
                  <th style={{textAlign:"center"}}>Đã lắp</th>
                  <th style={{textAlign:"center"}}>Hôm nay</th>
                  <th style={{textAlign:"center"}}>Trạng thái</th>
                  <th>Ghi chú KT</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {itemList.map(({ id: itemId, item }) => {
                  const need = (cfg as any)[itemId] || 0;
                  const total = getTotalQty(itemId);
                  return (
                    <tr key={itemId}>
                      <td style={{fontWeight:500}}>{item?.label || itemId} <span className="text-xs text-t2">({item?.unit || ""})</span></td>
                      <td style={{textAlign:"center"}}>{need || <span className="text-t2">--</span>}</td>
                      <td style={{textAlign:"center", fontWeight:600}}>{total}</td>
                      <td style={{textAlign:"center"}}>
                        <input type="number" id={`inst-qty-${itemId}`} placeholder="SL" style={{width:70, textAlign:"center"}} />
                      </td>
                      <td style={{textAlign:"center"}}>
                        <select id={`inst-status-${itemId}`}
                          style={{background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"6px 10px", color:"var(--text)", fontSize:12}}>
                          <option value="">OK</option>
                          <option value="loi">⚠ Lỗi</option>
                        </select>
                      </td>
                      <td>
                        <input type="text" id={`inst-note-${itemId}`} placeholder="Ghi chú" style={{minWidth:120}} />
                      </td>
                      <td>
                        <Button size="sm" onClick={() => save(itemId, item?.label || itemId, item?.unit || "")}>Lưu</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
