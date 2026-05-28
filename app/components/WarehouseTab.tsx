"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Select } from "./ui/Select";
import { ALL_ITEMS, PROD_ITEMS } from "@/lib/constants";

interface Project { id: string; name: string; location: string; prodTargets: Record<string,number>; instCfg: Record<string,number>; }
interface KhoEntry { id: string; projectId: string; itemId: string; qty: number; date: string; }
interface InstLog { id: string; projectId: string; itemId: string; qty: number; }

function r2(v: number) { return Math.round(v * 100) / 100; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export function WarehouseTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [khoEntries, setKhoEntries] = useState<KhoEntry[]>([]);
  const [instLogs, setInstLogs] = useState<InstLog[]>([]);
  const [selProject, setSelProject] = useState("");

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/projects").then(r=>r.json()),
      fetch("/api/kho_entries").then(r=>r.json()),
      fetch("/api/inst_logs").then(r=>r.json()),
    ]).then(([p, k, i]) => {
      setProjects(p); setKhoEntries(k); setInstLogs(i);
    }).catch(()=>{});
  }, []);
  useEffect(load, [load]);

  const filteredProjects = useMemo(() =>
    selProject ? projects.filter(p => p.id === selProject) : projects,
  [projects, selProject]);

  const projectRows = useMemo(() => {
    return filteredProjects.map(p => {
      const allTargets: Record<string,number> = {};
      const instCfg = p.instCfg || {};
      const prodTargets = p.prodTargets || {};
      const keys = new Set([...Object.keys(instCfg), ...Object.keys(prodTargets)]);
      for (const k of keys) {
        allTargets[k] = Math.max(instCfg[k] || 0, prodTargets[k] || 0);
      }

      const items = Object.entries(allTargets)
        .filter(([itemId]) => ALL_ITEMS.some(x => x.id === itemId))
        .map(([itemId, target]) => {
          const def = ALL_ITEMS.find(x => x.id === itemId)!;
          const isProduced = PROD_ITEMS.some(x => x.id === itemId);
          const khoQty = khoEntries
            .filter(e => e.projectId === p.id && e.itemId === itemId)
            .reduce((s, e) => s + e.qty, 0);
          const instQty = instLogs
            .filter(l => l.projectId === p.id && l.itemId === itemId)
            .reduce((s, l) => s + l.qty, 0);
          const tonKho = Math.max(0, khoQty - instQty);
          const chuaVaoKho = Math.max(0, target - khoQty);

          const pctInstalled = target > 0 ? (instQty / target) * 100 : 0;
          const pctTonKho = target > 0 ? (tonKho / target) * 100 : 0;
          const pctChua = target > 0 ? (chuaVaoKho / target) * 100 : 100;

          let status: { text: string; cls: string } = { text: "⏳ Chờ nhập kho", cls: "waiting" };
          if (instQty > 0 && instQty >= target) {
            status = { text: "✅ Hoàn thành", cls: "installing" };
          } else if (instQty > 0) {
            status = { text: "🔧 Đang lắp đặt", cls: "installing" };
          } else if (khoQty > 0) {
            status = { text: "📦 Trong kho", cls: "instock" };
          }

          return {
            itemId, itemName: def.label,
            source: isProduced ? "Tự SX" as const : "Mua ngoài" as const,
            khoQty: r2(khoQty), instQty: r2(instQty), tonKho: r2(tonKho),
            target, pctInstalled: clamp(pctInstalled, 0, 100),
            pctTonKho: clamp(pctTonKho, 0, 100),
            pctChua: clamp(pctChua, 0, 100),
            status,
          };
        })
        .filter(item => item.target > 0);

      return { project: p, items };
    });
  }, [filteredProjects, khoEntries, instLogs]);

  const allEmpty = projectRows.every(g => g.items.length === 0);

  return (
    <div>
      <h2 className="mb-16">Kho & Tiến độ vật tư</h2>

      {/* FILTER + WORKFLOW DIAGRAM */}
      <div className="wh-panel" style={{padding:0}}>
        <div style={{padding:"14px 20px"}}>
          <Select value={selProject} onChange={e => setSelProject(e.target.value)} style={{maxWidth:300}}>
            <option value="">📊 Tất cả CT</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>

        <div className="wh-flow">
          <span className="wh-chip blue">🛠 SX xong ➔ Nhập kho (tab SX)</span>
          <span className="wh-arrow">→</span>
          <span className="wh-chip green">📦 Tồn kho ➔ Lắp đặt</span>
          <span className="wh-sep">|</span>
          <span className="wh-chip purple">📦 Đặt mua ➔ ngày giao ➔ Tự vào kho</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {allEmpty ? (
        <div className="wh-panel">
          <div className="wh-empty">
            <div style={{fontSize:48, opacity:0.4, marginBottom:12}}>📦</div>
            <div>Chưa có dữ liệu vật tư. Thêm mục tiêu sản xuất hoặc lắp đặt trong Công trình.</div>
          </div>
        </div>
      ) : projectRows.map(({ project, items }) => (
        <div key={project.id} className="wh-panel">
          {/* PROJECT HEADER */}
          <div className="wh-panel-header">
            <div className="wh-ct-name">{project.name.toUpperCase()}</div>
            {project.location && (
              <div className="wh-location"><span className="wh-pin">📍</span> {project.location}</div>
            )}
          </div>

          {/* COLOR LEGEND */}
          <div className="wh-legend">
            <span className="wh-leg-item"><span className="wh-leg-swatch green"></span> Đã lắp</span>
            <span className="wh-leg-item"><span className="wh-leg-swatch blue"></span> Tồn kho</span>
            <span className="wh-leg-item"><span className="wh-leg-swatch gray"></span> Chưa vào kho</span>
          </div>

          {/* DATA TABLE */}
          <div className="wh-panel-body">
            <table className="wh-table">
              <thead>
                <tr>
                  <th className="left" style={{minWidth:200}}>Hạng mục</th>
                  <th style={{minWidth:65}}>Nguồn</th>
                  <th style={{minWidth:70}}>Vào kho</th>
                  <th style={{minWidth:65}}>Đã LĐ</th>
                  <th style={{minWidth:65}}>Tồn kho</th>
                  <th style={{minWidth:180}}>Tiến độ</th>
                  <th style={{minWidth:120}}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.itemId}>
                    <td className="left">
                      <span className="wh-item-name">{item.itemName}</span>
                    </td>
                    <td>
                      <span className={`wh-source ${item.source === "Tự SX" ? "sx" : "mua"}`}>
                        {item.source}
                      </span>
                    </td>
                    <td className="wh-num blue">{item.khoQty} m²</td>
                    <td className="wh-num green">{item.instQty} m²</td>
                    <td className="wh-num gray">{item.tonKho} m²</td>
                    <td>
                      <div className="wh-progress">
                        {item.pctInstalled > 0 && (
                          <div className="wh-bar green" style={{width:`${item.pctInstalled}%`}} />
                        )}
                        {item.pctTonKho > 0 && (
                          <div className="wh-bar blue" style={{width:`${item.pctTonKho}%`}} />
                        )}
                        {item.pctChua > 0 && (
                          <div className="wh-bar gray" style={{width:`${item.pctChua}%`}} />
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`wh-status-text ${item.status.cls}`}>{item.status.text}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
