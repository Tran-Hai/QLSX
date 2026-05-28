"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { getMon, weekDates, weekRangeStr, fmtDate, addDays, uid, todayStr } from "@/lib/utils";
import { ALL_ITEMS } from "@/lib/constants";

interface ProdLog {
  id: string; date: string; projectId: string; projectName: string;
  itemId: string; itemName: string; unit: string; qty: number; note: string;
}
interface Project { id: string; name: string; }

export function ReportTab() {
  const [mon, setMon] = useState(() => getMon(new Date()));
  const [projects, setProjects] = useState<Project[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [selProject, setSelProject] = useState("");

  const dates = weekDates(mon);
  const load = () => {
    fetch("/api/projects").then(r=>r.json()).then(setProjects).catch(()=>{});
    fetch("/api/prod_logs").then(r=>r.json()).then(setProdLogs).catch(()=>{});
  };
  useEffect(load, []);

  const dateStrs = dates.map(d => fmtDate(d));

  const getQty = (projectId: string, itemId: string, date: string) => {
    return prodLogs.find(l => l.projectId === projectId && l.itemId === itemId && l.date === date)?.qty || 0;
  };

  const setQty = async (projectId: string, projectName: string, itemId: string, itemName: string, unit: string, date: string, qty: number) => {
    const existing = prodLogs.find(l => l.projectId === projectId && l.itemId === itemId && l.date === date);
    if (existing) {
      if (qty === 0) {
        await fetch(`/api/prod_logs/${existing.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/prod_logs/${existing.id}`, {
          method: "PUT", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ ...existing, qty }),
        });
      }
    } else if (qty > 0) {
      const created = await fetch("/api/prod_logs", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ id: uid(), date, projectId, projectName, itemId, itemName, unit, qty, note: "", createdAt: todayStr() }),
      }).then(r=>r.json());
      setProdLogs(prev => [...prev, created]);
    }
    load();
  };

  const filteredProjects = selProject ? projects.filter(p => p.id === selProject) : projects;

  return (
    <div>
      <div className="flex justify-between items-center mb-16">
        <h2>Báo cáo công tác</h2>
        <div className="flex gap-8 items-center">
          <Select value={selProject} onChange={e => setSelProject(e.target.value)} style={{width:200}}>
            <option value="">Tất cả công trình</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Button size="sm" variant="ghost" onClick={() => setMon(addDays(mon, -7))}>◀</Button>
          <span className="text-sm" style={{fontWeight:500, minWidth:160, textAlign:"center"}}>{weekRangeStr(mon)}</span>
          <Button size="sm" variant="ghost" onClick={() => setMon(addDays(mon, 7))}>▶</Button>
        </div>
      </div>

      {filteredProjects.map(project => (
        <div key={project.id} className="card mb-16">
          <h3 className="mb-12" style={{fontSize:15}}>{project.name}</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{position:"sticky", left:0, zIndex:1}}>Hạng mục</th>
                  {dateStrs.map((d, i) => (
                    <th key={d} style={{textAlign:"center", minWidth:70}}>
                      {["T2","T3","T4","T5","T6","T7","CN"][i]}
                      <div style={{fontWeight:400, fontSize:10}}>{d.slice(5)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_ITEMS.map(item => (
                  <tr key={item.id}>
                    <td style={{fontWeight:500, position:"sticky", left:0, background:"var(--card)", zIndex:1}}>
                      {item.label}
                      <span className="text-xs text-t2" style={{marginLeft:6}}>({item.unit})</span>
                    </td>
                    {dateStrs.map(d => {
                      const q = getQty(project.id, item.id, d);
                      return (
                        <td key={d} style={{textAlign:"center"}}>
                          <input type="number" value={q || ""} style={{width:"100%", minWidth:50, textAlign:"center", padding:"6px 4px"}}
                            placeholder="0"
                            onChange={e => {
                              const v = Number(e.target.value) || 0;
                              setQty(project.id, project.name, item.id, item.label, item.unit, d, v);
                            }} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      {filteredProjects.length === 0 && (
        <div className="card text-center text-t2" style={{padding:40}}>Không có dữ liệu</div>
      )}
    </div>
  );
}
