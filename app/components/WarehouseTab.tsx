"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Select } from "./ui/Select";
import { ALL_ITEMS, KHO_INST_MAP } from "@/lib/constants";

interface Project { id: string; name: string; location: string; prodTargets: Record<string,number>; instCfg: Record<string,number>; }
interface KhoEntry { id: string; projectId: string; itemId: string; qty: number; date: string; }
interface InstLog { id: string; projectId: string; itemId: string; qty: number; }
interface PurchaseOrder { id: string; projectId: string; itemId: string; supplier: string; totalQty: number; deliveredQty: number; status: string; }

function r2(v: number) { return Math.round(v * 100) / 100; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export function WarehouseTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [khoEntries, setKhoEntries] = useState<KhoEntry[]>([]);
  const [instLogs, setInstLogs] = useState<InstLog[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selProject, setSelProject] = useState("");

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/projects").then(r=>r.json()),
      fetch("/api/kho_entries").then(r=>r.json()),
      fetch("/api/inst_logs").then(r=>r.json()),
      fetch("/api/purchase_orders").then(r=>r.json()),
    ]).then(([p, k, i, po]) => {
      setProjects(p); setKhoEntries(k); setInstLogs(i); setPurchaseOrders(po);
    }).catch(()=>{});
  }, []);
  useEffect(load, [load]);

  // Build lookup: which project+item has any purchase order
  const poLookup = useMemo(() => {
    const s = new Set<string>();
    for (const po of purchaseOrders) {
      s.add(`${po.projectId}:${po.itemId}`);
    }
    return s;
  }, [purchaseOrders]);

  const filteredProjects = useMemo(() =>
    selProject ? projects.filter(p => p.id === selProject) : projects,
  [projects, selProject]);

  const projectRows = useMemo(() => {
    // Build reverse map: production item ID → [installation item IDs that consume it]
    const reverseInstMap: Record<string, string[]> = {};
    for (const [instId, prodId] of Object.entries(KHO_INST_MAP)) {
      if (!reverseInstMap[prodId]) reverseInstMap[prodId] = [];
      reverseInstMap[prodId].push(instId);
    }

    return filteredProjects.map(p => {
      const instCfg = p.instCfg || {};
      const prodTargets = p.prodTargets || {};
      const processed = new Set<string>();
      const items: {
        itemId: string; itemName: string; unit: string;
        source: "Tự SX" | "Mua ngoài" | "Đặt mua";
        target: number; khoQty: number; instQty: number; tonKho: number;
        pctInstalled: number; pctTonKho: number; pctChua: number;
        status: { text: string; cls: string };
      }[] = [];

      // Phase 1: process production items (self-produced → merge with installation if mapped)
      for (const [prodId, prodTarget] of Object.entries(prodTargets)) {
        if (processed.has(prodId)) continue;
        processed.add(prodId);
        const prodDef = ALL_ITEMS.find(x => x.id === prodId);
        if (!prodDef || prodTarget <= 0) continue;

        const instIds = reverseInstMap[prodId] || [];
        const instTargets = instIds.map(id => instCfg[id] || 0);
        const totalTarget = Math.max(prodTarget, ...instTargets);

        const khoQty = khoEntries
          .filter(e => e.projectId === p.id && e.itemId === prodId)
          .reduce((s, e) => s + e.qty, 0);

        let instQty = 0;
        for (const instId of instIds) {
          processed.add(instId);
          instQty += instLogs
            .filter(l => l.projectId === p.id && l.itemId === instId)
            .reduce((s, l) => s + l.qty, 0);
        }
        // Also check instLogs directly for the production item (edge case)
        instQty += instLogs
          .filter(l => l.projectId === p.id && l.itemId === prodId)
          .reduce((s, l) => s + l.qty, 0);

        const tonKho = Math.max(0, khoQty - instQty);
        const pctInstalled = totalTarget > 0 ? (instQty / totalTarget) * 100 : 0;
        const pctTonKho = totalTarget > 0 ? (tonKho / totalTarget) * 100 : 0;
        const pctChua = totalTarget > 0 ? Math.max(0, 100 - pctInstalled - pctTonKho) : 100;

        let status: { text: string; cls: string } = { text: "⏳ Chờ nhập kho", cls: "waiting" };
        if (instQty > 0 && instQty >= totalTarget) {
          status = { text: "✅ Hoàn thành", cls: "installing" };
        } else if (instQty > 0) {
          status = { text: "🔧 Đang lắp đặt", cls: "installing" };
        } else if (khoQty > 0) {
          status = { text: "📦 Trong kho", cls: "instock" };
        }

        items.push({
          itemId: prodId, itemName: prodDef.label, unit: prodDef.unit,
          source: "Tự SX",
          target: totalTarget, khoQty: r2(khoQty), instQty: r2(instQty), tonKho: r2(tonKho),
          pctInstalled: clamp(pctInstalled, 0, 100),
          pctTonKho: clamp(pctTonKho, 0, 100),
          pctChua: clamp(pctChua, 0, 100),
          status,
        });
      }

      // Phase 2: process remaining installation items (mua ngoài, no production mapping)
      for (const [instId, instTarget] of Object.entries(instCfg)) {
        if (processed.has(instId) || instTarget <= 0) continue;
        processed.add(instId);
        const instDef = ALL_ITEMS.find(x => x.id === instId);
        if (!instDef) continue;

        // Check if this install item has a production counterpart in KHO_INST_MAP
        // that wasn't captured in phase 1 (project has no prodTarget for it)
        const mappedProdId = KHO_INST_MAP[instId];
        const prodTargetExists = mappedProdId && (prodTargets[mappedProdId] || 0) > 0;

        // Source: Tự SX if the production counterpart exists in prodTargets, else Mua ngoài
        const isMuaNgoai = !mappedProdId || !prodTargetExists;

        let khoQty = 0;
        if (mappedProdId) {
          // Check kho entries for the production item that supplies this install item
          khoQty = khoEntries
            .filter(e => e.projectId === p.id && e.itemId === mappedProdId)
            .reduce((s, e) => s + e.qty, 0);
          // Also check kho entries for the install item itself
          khoQty += khoEntries
            .filter(e => e.projectId === p.id && e.itemId === instId)
            .reduce((s, e) => s + e.qty, 0);
        } else {
          khoQty = khoEntries
            .filter(e => e.projectId === p.id && e.itemId === instId)
            .reduce((s, e) => s + e.qty, 0);
        }

        const instQty = instLogs
          .filter(l => l.projectId === p.id && l.itemId === instId)
          .reduce((s, l) => s + l.qty, 0);

        const tonKho = Math.max(0, khoQty - instQty);
        const pctInstalled = instTarget > 0 ? (instQty / instTarget) * 100 : 0;
        const pctTonKho = instTarget > 0 ? (tonKho / instTarget) * 100 : 0;
        const pctChua = instTarget > 0 ? Math.max(0, 100 - pctInstalled - pctTonKho) : 100;

        let status: { text: string; cls: string } = { text: "⏳ Chờ nhập kho", cls: "waiting" };
        if (instQty > 0 && instQty >= instTarget) {
          status = { text: "✅ Hoàn thành", cls: "installing" };
        } else if (instQty > 0) {
          status = { text: "🔧 Đang lắp đặt", cls: "installing" };
        } else if (khoQty > 0) {
          status = { text: "📦 Trong kho", cls: "instock" };
        }

        const hasPO = poLookup.has(`${p.id}:${instId}`);
        const sourceLabel = isMuaNgoai ? (hasPO ? "Đặt mua" : "Mua ngoài") : "Tự SX";
        items.push({
          itemId: instId, itemName: instDef.label, unit: instDef.unit,
          source: sourceLabel,
          target: instTarget, khoQty: r2(khoQty), instQty: r2(instQty), tonKho: r2(tonKho),
          pctInstalled: clamp(pctInstalled, 0, 100),
          pctTonKho: clamp(pctTonKho, 0, 100),
          pctChua: clamp(pctChua, 0, 100),
          status,
        });
      }

      return { project: p, items };
    });
  }, [filteredProjects, khoEntries, instLogs, poLookup]);

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
                  <th style={{minWidth:55}}>Nguồn</th>
                  <th style={{minWidth:55}}>KL Cần</th>
                  <th style={{minWidth:75}}>Đã SX (Vào kho)</th>
                  <th style={{minWidth:70}}>Đã Lắp đặt</th>
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
                      <span className={`wh-source ${item.source === "Tự SX" ? "sx" : item.source === "Đặt mua" ? "po" : "mua"}`}>
                        {item.source === "Đặt mua" ? "\u{1F4E6} \u0110\u1EB7t mua" : item.source}
                      </span>
                    </td>
                    <td className="wh-num">{item.target} {item.unit}</td>
                    <td className="wh-num blue">{item.khoQty} {item.unit}</td>
                    <td className="wh-num green">{item.instQty} {item.unit}</td>
                    <td className="wh-num gray">{item.tonKho} {item.unit}</td>
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
