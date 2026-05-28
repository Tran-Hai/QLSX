"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { ALL_ITEMS } from "@/lib/constants";

interface ProjectExtended {
  id: string; name: string;
  prodTargets: Record<string, number>;
}
interface ProdLog { id: string; projectId: string; itemId: string; qty: number; date: string; }
interface KhoEntry { id: string; projectId: string; itemId: string; qty: number; date: string; createdAt: string; }

export function WarehouseTab() {
  const [projects, setProjects] = useState<ProjectExtended[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [khoEntries, setKhoEntries] = useState<KhoEntry[]>([]);
  const [selProject, setSelProject] = useState("");

  const load = () => {
    fetch("/api/projects").then(r=>r.json()).then(setProjects).catch(()=>{});
    fetch("/api/prod_logs").then(r=>r.json()).then(setProdLogs).catch(()=>{});
    fetch("/api/kho_entries").then(r=>r.json()).then(setKhoEntries).catch(()=>{});
  };

  useEffect(load, []);

  const project = projects.find(p => p.id === selProject);
  const targets = project?.prodTargets || {};

  const getProdQty = (itemId: string) =>
    prodLogs.filter(l => l.projectId === selProject && l.itemId === itemId).reduce((s, l) => s + l.qty, 0);

  const getKhoQty = (itemId: string) =>
    khoEntries.filter(e => e.projectId === selProject && e.itemId === itemId).reduce((s, e) => s + e.qty, 0);

  const delKho = async (id: string) => {
    await fetch(`/api/kho_entries/${id}`, { method: "DELETE" });
    load();
  };

  const filteredKho = khoEntries.filter(e => !selProject || e.projectId === selProject);

  return (
    <div>
      <h2 className="mb-16">Kho</h2>
      <div className="card mb-16">
        <Select value={selProject} onChange={e => setSelProject(e.target.value)} style={{maxWidth:300}}>
          <option value="">-- Tất cả công trình --</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      {project && (
        <div className="card mb-16">
          <h3 className="mb-12" style={{fontSize:15}}>Tổng hợp kho - {project.name}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Hạng mục</th>
                  <th style={{textAlign:"center"}}>Mục tiêu</th>
                  <th style={{textAlign:"center"}}>Đã SX</th>
                  <th style={{textAlign:"center"}}>Đã nhập kho</th>
                  <th style={{textAlign:"center"}}>Tồn</th>
                  <th style={{textAlign:"center"}}>Còn lại</th>
                </tr>
              </thead>
              <tbody>
                {ALL_ITEMS.map(item => {
                  const target = (targets as any)[item.id] || 0;
                  const prod = getProdQty(item.id);
                  const kho = getKhoQty(item.id);
                  return (
                    <tr key={item.id}>
                      <td style={{fontWeight:500}}>{item.label}</td>
                      <td style={{textAlign:"center"}}>{target || <span className="text-t2">--</span>}</td>
                      <td style={{textAlign:"center"}}>{prod}</td>
                      <td style={{textAlign:"center"}}>{kho}</td>
                      <td style={{textAlign:"center", color: (target - kho) < 0 ? "var(--red)" : "var(--green)", fontWeight:600}}>
                        {target ? Math.max(0, target - kho) : <span className="text-t2">--</span>}
                      </td>
                      <td style={{textAlign:"center", color: (target - prod) < 0 ? "var(--red)" : "var(--green)", fontWeight:600}}>
                        {target ? Math.max(0, target - prod) : <span className="text-t2">--</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="mb-12" style={{fontSize:15}}>Lịch sử nhập kho</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ngày</th><th>Công trình</th><th>Hạng mục</th><th style={{textAlign:"center"}}>Số lượng</th><th></th></tr></thead>
            <tbody>
              {filteredKho.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(e => {
                const p = projects.find(x => x.id === e.projectId);
                const item = ALL_ITEMS.find(x => x.id === e.itemId);
                return (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{p?.name || e.projectId}</td>
                    <td>{item?.label || e.itemId}</td>
                    <td style={{textAlign:"center", fontWeight:600}}>{e.qty}</td>
                    <td style={{textAlign:"right"}}><Button size="sm" variant="danger" onClick={() => delKho(e.id)}>✕</Button></td>
                  </tr>
                );
              })}
              {filteredKho.length === 0 && (
                <tr><td colSpan={5} className="text-center text-t2" style={{padding:20}}>Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
