"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { uid, todayStr } from "@/lib/utils";
import { PN } from "@/lib/constants";

interface ProjectExtended {
  id: string; name: string;
  prodTargets: Record<string, number>;
  prodBatches: Record<string, number>;
}
interface ProdLog { id: string; projectId: string; itemId: string; date: string; qty: number; }
interface KhoEntry { id: string; projectId: string; itemId: string; qty: number; }

export function ProductionTab() {
  const [projects, setProjects] = useState<ProjectExtended[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [khoEntries, setKhoEntries] = useState<KhoEntry[]>([]);
  const [selProject, setSelProject] = useState("");
  const [date, setDate] = useState(todayStr());

  const load = () => {
    fetch("/api/projects").then(r=>r.json()).then(setProjects).catch(()=>{});
    fetch("/api/prod_logs").then(r=>r.json()).then(setProdLogs).catch(()=>{});
    fetch("/api/kho_entries").then(r=>r.json()).then(setKhoEntries).catch(()=>{});
  };

  useEffect(load, []);

  const project = projects.find(p => p.id === selProject);
  const targets = project?.prodTargets || {};

  const getProdQty = (itemId: string) => {
    return prodLogs.filter(l => l.projectId === selProject && l.itemId === itemId).reduce((s, l) => s + l.qty, 0);
  };

  const getKhoQty = (itemId: string) => {
    return khoEntries.filter(e => e.projectId === selProject && e.itemId === itemId).reduce((s, e) => s + e.qty, 0);
  };

  const save = async (type: "prod" | "kho", itemId: string, itemName: string, unit: string, qty: number) => {
    if (!selProject || !project) return;
    if (type === "prod") {
      await fetch("/api/prod_logs", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ id: uid(), date, projectId: selProject, projectName: project.name, itemId, itemName, unit, qty, note: "", createdAt: todayStr() }),
      });
    } else {
      await fetch("/api/kho_entries", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ id: uid(), date, projectId: selProject, itemId, qty, createdAt: todayStr() }),
      });
    }
    load();
  };

  const itemList = Object.keys(targets).length > 0 ? Object.keys(targets).map(id => ({ id, item: PN.find(p => p.id === id) })) : PN.map(p => ({ id: p.id, item: p }));

  return (
    <div>
      <h2 className="mb-16">Sản xuất & Nhập kho</h2>
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
                  <th style={{textAlign:"center"}}>Mục tiêu</th>
                  <th style={{textAlign:"center"}}>Đã SX</th>
                  <th style={{textAlign:"center"}}>Nhập kho</th>
                  <th style={{textAlign:"center"}}>Tồn</th>
                  <th style={{textAlign:"center"}}>Còn lại</th>
                  <th style={{textAlign:"center"}} colSpan={2}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {itemList.map(({ id: itemId, item }) => {
                  const target = (targets as any)[itemId] || 0;
                  const prod = getProdQty(itemId);
                  const kho = getKhoQty(itemId);
                  const ton = target - kho;
                  const con = target - prod;
                  return (
                    <tr key={itemId}>
                      <td style={{fontWeight:500}}>{item?.label || itemId} <span className="text-xs text-t2">({item?.unit || ""})</span></td>
                      <td style={{textAlign:"center"}}>{target || <span className="text-t2">--</span>}</td>
                      <td style={{textAlign:"center"}}>{prod}</td>
                      <td style={{textAlign:"center"}}>{kho}</td>
                      <td style={{textAlign:"center", color: ton < 0 ? "var(--red)" : "var(--green)", fontWeight:600}}>
                        {target ? Math.max(0, ton) : <span className="text-t2">--</span>}
                      </td>
                      <td style={{textAlign:"center", color: con < 0 ? "var(--red)" : "var(--green)", fontWeight:600}}>
                        {target ? Math.max(0, con) : <span className="text-t2">--</span>}
                      </td>
                      <td style={{textAlign:"center"}}>
                        <input type="number" placeholder="SX" style={{width:65, display:"inline"}}
                          id={`sx-${itemId}`} />
                        <Button size="sm" onClick={() => {
                          const el = document.getElementById(`sx-${itemId}`) as HTMLInputElement;
                          const v = Number(el.value);
                          if (v > 0) { save("prod", itemId, item?.label || itemId, item?.unit || "", v); el.value = ""; }
                        }} style={{marginLeft:4}}>SX</Button>
                      </td>
                      <td style={{textAlign:"center"}}>
                        <input type="number" placeholder="Kho" style={{width:65, display:"inline"}}
                          id={`kho-${itemId}`} />
                        <Button size="sm" variant="success" onClick={() => {
                          const el = document.getElementById(`kho-${itemId}`) as HTMLInputElement;
                          const v = Number(el.value);
                          if (v > 0) { save("kho", itemId, item?.label || itemId, item?.unit || "", v); el.value = ""; }
                        }} style={{marginLeft:4}}>Kho</Button>
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
