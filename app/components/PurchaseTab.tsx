"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Select } from "./ui/Select";
import { uid, todayStr } from "@/lib/utils";
import { ALL_ITEMS } from "@/lib/constants";

interface PurchaseOrder {
  id: string; projectId: string; projectName: string;
  itemId: string; itemName: string; unit: string;
  supplier: string; totalQty: number; deliveredQty: number;
  expectedDate: string; note: string; status: string;
  createdAt: string;
}
interface Project { id: string; name: string; }
interface KhoEntry { id: string; projectId: string; itemId: string; qty: number; date: string; }

function r2(v: number) { return Math.round(v * 100) / 100; }
function fmtDisplay(d: string) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

const STATUS_OPTS: Record<string, { label: string; color: string }> = {
  cho_bao_gia: { label: "⏳ Chờ báo giá", color: "var(--t3)" },
  da_dat_cho_giao: { label: "🚚 Chờ giao", color: "var(--blue)" },
  da_giao_du: { label: "✅ Đã giao đủ", color: "var(--green)" },
  da_giao_mot_phan: { label: "📦 Đã giao 1 phần", color: "var(--warn)" },
};

export function PurchaseTab() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filterProject, setFilterProject] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [deliveryInputs, setDeliveryInputs] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState<Record<string,boolean>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<PurchaseOrder>>({});

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/purchase_orders").then(r=>r.json()),
      fetch("/api/projects").then(r=>r.json()),
    ]).then(([o, p]) => {
      setOrders(o); setProjects(p);
    }).catch(()=>{});
  }, []);
  useEffect(load, [load]);

  const suppliers = useMemo(() => {
    const s = new Set(orders.map(o => o.supplier).filter(Boolean));
    return [...s].sort();
  }, [orders]);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (filterProject) list = list.filter(o => o.projectId === filterProject);
    if (filterSupplier) list = list.filter(o => o.supplier === filterSupplier);
    if (filterStatus) list = list.filter(o => o.status === filterStatus);
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [orders, filterProject, filterSupplier, filterStatus]);

  const confirmDelivery = async (orderId: string) => {
    const qty = parseFloat(deliveryInputs[orderId] || "0");
    if (qty <= 0) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const saveKey = `deliver:${orderId}`;
    setSaving(prev => ({ ...prev, [saveKey]: true }));
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const newDelivered = order.deliveredQty + qty;
    const newStatus = newDelivered >= order.totalQty ? "da_giao_du" : "da_giao_mot_phan";
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`/api/purchase_orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...order, deliveredQty: newDelivered, status: newStatus,
          }),
        }),
        fetch("/api/kho_entries", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: uid(), date: todayStr(), projectId: order.projectId,
            itemId: order.itemId, qty, createdAt: todayStr(),
          }),
        }),
        fetch("/api/activity_logs", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: uid(), date: todayStr(), time: timeStr,
            projectId: order.projectId, projectName: order.projectName,
            itemId: order.itemId, itemName: order.itemName, unit: order.unit, qty,
            action: "nhap_kho", actionLabel: `\u{1F4E6} \u0110\u1EB7t mua t\u1EEB ${order.supplier}`,
            actorName: "", actorRole: "", note: "", createdAt: todayStr(),
          }),
        }),
      ]);
      if (!r1.ok || !r2.ok || !r3.ok) throw new Error("Confirm failed");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveredQty: newDelivered, status: newStatus } : o));
      setDeliveryInputs(prev => ({ ...prev, [orderId]: "" }));
    } finally {
      setSaving(prev => ({ ...prev, [saveKey]: false }));
    }
  };

  const saveOrder = async () => {
    if (!form.projectId || !form.itemId || !form.totalQty || !form.supplier) return;
    const project = projects.find(p => p.id === form.projectId);
    const def = ALL_ITEMS.find(x => x.id === form.itemId);
    if (!project || !def) return;
    const order: PurchaseOrder = {
      id: uid(), projectId: form.projectId, projectName: project.name,
      itemId: form.itemId, itemName: def.label, unit: def.unit,
      supplier: form.supplier, totalQty: form.totalQty, deliveredQty: 0,
      expectedDate: form.expectedDate || "", note: form.note || "",
      status: "cho_bao_gia", createdAt: todayStr(),
    };
    try {
      const res = await fetch("/api/purchase_orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error("Save failed");
      setOrders(prev => [order, ...prev]);
      setShowForm(false);
      setForm({});
    } catch (e) { alert("Lỗi lưu đơn hàng"); }
  };

  return (
    <div>
      <h2 className="mb-16">Quản lý Đặt hàng</h2>

      {/* Filters + Add button */}
      <div className="cal-toolbar" style={{flexWrap:"wrap", gap:8}}>
        <Select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{maxWidth:200}}>
          <option value="">📊 Tất cả dự án</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} style={{maxWidth:180}}>
          <option value="">🏢 Tất cả NCC</option>
          {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{maxWidth:160}}>
          <option value="">🔍 Tất cả trạng thái</option>
          {Object.entries(STATUS_OPTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        <Button onClick={() => { setForm({}); setShowForm(true); }} style={{marginLeft:"auto"}}>
          + Đơn đặt hàng mới
        </Button>
      </div>

      {/* Table */}
      <div className="card" style={{overflowX:"auto"}}>
        <table className="pd-table" style={{minWidth:900}}>
          <thead>
            <tr>
              <th className="left" style={{minWidth:150}}>Công trình</th>
              <th className="left" style={{minWidth:180}}>Hạng mục đặt mua</th>
              <th style={{minWidth:100}}>NCC</th>
              <th style={{minWidth:60}}>KL Cần</th>
              <th style={{minWidth:60}}>Đã Đặt</th>
              <th style={{minWidth:90}}>Ngày hẹn giao</th>
              <th style={{minWidth:100}}>Hôm nay giao</th>
              <th style={{minWidth:140}}>Trạng thái</th>
              <th style={{minWidth:90}}>Xác nhận</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{padding:40, textAlign:"center", color:"var(--t3)"}}>Chưa có đơn đặt hàng</td></tr>
            ) : filtered.map(order => {
              const isDone = order.status === "da_giao_du";
              const saveKey = `deliver:${order.id}`;
              const isSaving = saving[saveKey];
              const inputVal = deliveryInputs[order.id] ?? "";
              return (
                <tr key={order.id}>
                  <td className="left" style={{fontWeight:500, fontSize:12}}>{order.projectName}</td>
                  <td className="left" style={{fontSize:12}}><span className="wh-item-name">{order.itemName}</span></td>
                  <td style={{fontSize:12}}>{order.supplier}</td>
                  <td className="pd-num">{r2(order.totalQty)} {order.unit}</td>
                  <td className="pd-num blue">{r2(order.deliveredQty)} {order.unit}</td>
                  <td style={{fontSize:11}}>{order.expectedDate ? fmtDisplay(order.expectedDate) : "—"}</td>
                  <td>
                    {isDone ? (
                      <span style={{color:"var(--t3)", fontSize:11}}>—</span>
                    ) : (
                      <input type="number" step="0.001" min="0" className="pd-input"
                        style={{width:80}} placeholder="SL..."
                        value={inputVal}
                        onChange={e => setDeliveryInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") confirmDelivery(order.id); }} />
                    )}
                  </td>
                  <td>
                    <span className={`po-status ${order.status}`}>
                      {STATUS_OPTS[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td>
                    <button className={`pd-btn-record${isSaving ? " loading" : ""}`}
                      disabled={isDone || isSaving || !(parseFloat(inputVal) > 0)}
                      onClick={() => confirmDelivery(order.id)}
                      title="Ghi nhận giao hàng">✓ Ghi nhận</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add order modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Tạo đơn đặt hàng mới">
        <div className="frm">
          <div>
            <label>Công trình</label>
            <Select value={form.projectId || ""} onChange={e => setForm({...form, projectId: e.target.value})}>
              <option value="">-- Chọn CT --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <label>Hạng mục</label>
            <Select value={form.itemId || ""} onChange={e => setForm({...form, itemId: e.target.value})}>
              <option value="">-- Chọn hạng mục --</option>
              {ALL_ITEMS.map(item => <option key={item.id} value={item.id}>{item.label} ({item.unit})</option>)}
            </Select>
          </div>
          <div>
            <label>Nhà cung cấp</label>
            <input type="text" value={form.supplier || ""} onChange={e => setForm({...form, supplier: e.target.value})}
              placeholder="Tên NCC" />
          </div>
          <div>
            <label>Khối lượng cần đặt</label>
            <input type="number" step="0.001" min="0" value={form.totalQty || ""}
              onChange={e => setForm({...form, totalQty: parseFloat(e.target.value) || 0})} placeholder="KL" />
          </div>
          <div>
            <label>Ngày hẹn giao</label>
            <input type="date" value={form.expectedDate || ""} onChange={e => setForm({...form, expectedDate: e.target.value})} />
          </div>
          <div>
            <label>Ghi chú</label>
            <input type="text" value={form.note || ""} onChange={e => setForm({...form, note: e.target.value})} placeholder="Ghi chú" />
          </div>
          <div className="frm-actions">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Huỷ</Button>
            <Button onClick={saveOrder}>Tạo đơn hàng</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
