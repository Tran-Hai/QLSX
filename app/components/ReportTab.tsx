"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { uid, fmtDate, todayStr } from "@/lib/utils";
import { ALL_ITEMS } from "@/lib/constants";

interface Project { id: string; name: string; location: string; }
interface ProdLog { id: string; date: string; projectId: string; projectName: string; itemId: string; itemName: string; unit: string; qty: number; note: string; }
interface InstLog { id: string; date: string; projectId: string; projectName: string; itemId: string; itemName: string; unit: string; qty: number; note: string; techStatus: string; }
interface KhoEntry { id: string; date: string; projectId: string; itemId: string; qty: number; }
interface CongNhat { id: string; date: string; projectId: string; projectName: string; description: string; workers: number; hours: number; }
interface TaskItem { id: string; name: string; status: string; dueDate: string; }

function sumQty(arr: { qty: number }[]) {
  return arr.reduce((s, x) => s + (x.qty || 0), 0);
}

export function ReportTab() {
  const [rtab, setRtab] = useState("ngay");
  const [projects, setProjects] = useState<Project[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [instLogs, setInstLogs] = useState<InstLog[]>([]);
  const [khoEntries, setKhoEntries] = useState<KhoEntry[]>([]);
  const [congNhat, setCongNhat] = useState<CongNhat[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [date, setDate] = useState(todayStr());
  const [rangeFrom, setRangeFrom] = useState(todayStr());
  const [rangeTo, setRangeTo] = useState(todayStr());
  const [toggleDayWeek, setToggleDayWeek] = useState<"ngay" | "tuan">("ngay");
  const [taskDate, setTaskDate] = useState(todayStr());
  const [dataSize, setDataSize] = useState("0");

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/projects").then(r=>r.json()),
      fetch("/api/prod_logs").then(r=>r.json()),
      fetch("/api/inst_logs").then(r=>r.json()),
      fetch("/api/kho_entries").then(r=>r.json()),
      fetch("/api/cong_nhat").then(r=>r.json()),
      fetch("/api/tasks").then(r=>r.json()),
      fetch("/api/staff").then(r=>r.json()),
    ]).then(([p, pl, il, ke, cn, t, s]) => {
      setProjects(p); setProdLogs(pl); setInstLogs(il);
      setKhoEntries(ke); setCongNhat(cn); setTasks(t); setStaff(s);
      const js = JSON.stringify({p,pl,il,ke,cn,t,s});
      setDataSize((new Blob([js]).size / 1024).toFixed(1));
    }).catch(()=>{});
  }, []);

  useEffect(load, [load]);

  // === BÁO CÁO NGÀY ===
  const dayProd = prodLogs.filter(l => l.date === date);
  const dayKho = khoEntries.filter(e => e.date === date);
  const dayCN = congNhat.filter(c => c.date === date);
  const dayTasks = tasks.filter(t => t.dueDate === date);
  const dayInst = instLogs.filter(l => l.date === date);

  const sxTotal = sumQty(dayProd);
  const ldTotal = sumQty(dayInst);
  const khoTotal = sumQty(dayKho);
  const cnTotal = dayCN.reduce((s, c) => s + c.workers, 0);
  const tasksDone = dayTasks.filter(t => t.status === "done").length;

  const prodByProject: Record<string, ProdLog[]> = {};
  dayProd.forEach(l => {
    if (!prodByProject[l.projectName]) prodByProject[l.projectName] = [];
    prodByProject[l.projectName].push(l);
  });

  // === THEO KHOẢNG ===
  const rangeProd = prodLogs.filter(l => l.date >= rangeFrom && l.date <= rangeTo);
  const rangeInst = instLogs.filter(l => l.date >= rangeFrom && l.date <= rangeTo);
  const rangeKho = khoEntries.filter(e => e.date >= rangeFrom && e.date <= rangeTo);
  const rangeCN = congNhat.filter(c => c.date >= rangeFrom && c.date <= rangeTo);

  const sxTotalRange = sumQty(rangeProd);
  const ldTotalRange = sumQty(rangeInst);
  const rangeDays = new Set(rangeProd.map(l => l.date).concat(rangeInst.map(l => l.date))).size;
  const cnTotalRange = rangeCN.reduce((s, c) => s + c.workers, 0);

  const sxByProject: Record<string, number> = {};
  rangeProd.forEach(l => { sxByProject[l.projectName] = (sxByProject[l.projectName] || 0) + l.qty; });
  const ldByProject: Record<string, number> = {};
  rangeInst.forEach(l => { ldByProject[l.projectName] = (ldByProject[l.projectName] || 0) + l.qty; });

  // === BÁO CÁO CÔNG TÁC ===
  const filterTasks = toggleDayWeek === "ngay"
    ? tasks.filter(t => t.dueDate === taskDate)
    : tasks.filter(t => {
        const d = new Date(t.dueDate);
        const tDate = new Date(taskDate);
        const start = new Date(tDate);
        start.setDate(start.getDate() - start.getDay() + 1);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return d >= start && d <= end;
      });

  const tcDone = filterTasks.filter(t => t.status === "done").length;
  const tcDoing = filterTasks.filter(t => t.status === "doing").length;
  const tcDueToday = filterTasks.filter(t => t.dueDate === taskDate && t.status !== "done").length;
  const tcOverdue = filterTasks.filter(t => t.dueDate < todayStr() && t.status !== "done").length;

  // === SAO LƯU & XUẤT ===
  const exportJSON = async () => {
    const data = { projects, prodLogs, instLogs, khoEntries, staff, tasks, congNhat: congNhat };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `qlsx-backup-${todayStr()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const res = await fetch("/api/sync/push", {
          method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data),
        });
        const r = await res.json();
        alert(`Nhập dữ liệu thành công: ${JSON.stringify(r.synced)}`);
        load();
      } catch (err: any) {
        alert("Lỗi: " + err.message);
      }
    };
    input.click();
  };

  const exportCSV = async (table: string, filename: string) => {
    const res = await fetch(`/api/${table}`);
    if (!res.ok || !res.body) { alert("Lỗi khi tải dữ liệu"); return; }
    let data: any[];
    try { data = await res.json(); } catch { alert("Không thể đọc dữ liệu từ máy chủ"); return; }
    if (!data.length) { alert("Không có dữ liệu"); return; }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map((r: any) => headers.map(h => `"${(r[h]||"").toString().replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const navDate = (d: string, delta: number) => {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + delta);
    return fmtDate(dt);
  };

  const reportTabs = [
    { id: "ngay", icon: "📅", label: "Báo cáo ngày" },
    { id: "khoang", icon: "📈", label: "Theo khoảng" },
    { id: "congtac", icon: "📌", label: "Báo cáo công tác" },
    { id: "saoluu", icon: "💾", label: "Sao lưu & Xuất" },
  ];

  const kpiIcon = (cat: string) => {
    const colors: Record<string, string> = {blue:"var(--blue)", green:"var(--green)", warn:"var(--warn)", orange:"#ff9500", red:"var(--red)", gray:"var(--t3)"};
    return colors[cat] || "var(--t2)";
  };

  return (
    <div>
      <h2 className="mb-16">Báo cáo</h2>

      {/* Main Tab Bar */}
      <div className="tab-inline" style={{marginBottom:20}}>
        {reportTabs.map(t => (
          <button key={t.id} className={`tab-inline-btn ${rtab === t.id ? "active" : ""}`} onClick={() => setRtab(t.id)}>
            <span style={{marginRight:6}}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* === TAB 1: BÁO CÁO NGÀY === */}
      {rtab === "ngay" && (
        <>
          <div className="cal-toolbar">
            <Button size="sm" variant="ghost" onClick={() => setDate(navDate(date, -1))}>◀</Button>
            <span className="ct-label">📅 {date}</span>
            <Button size="sm" variant="ghost" onClick={() => setDate(navDate(date, 1))}>▶</Button>
            <Button size="sm" variant="ghost" onClick={() => setDate(todayStr())}>Hôm nay</Button>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{maxWidth:160}} />
            <Button size="sm" style={{marginLeft:"auto"}} onClick={() => window.print()}>
              🖨️ In / Xuất PDF
            </Button>
          </div>

          <div className="rp-kpi-grid">
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(108,140,255,0.12)"}}>🔧</div>
              <div className="rk-info"><div className="rk-num" style={{color:kpiIcon("blue")}}>{sxTotal.toFixed(3)}</div>
                <div className="rk-label">SX hôm nay <span className="rk-unit">đv</span></div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(76,217,100,0.12)"}}>🔨</div>
              <div className="rk-info"><div className="rk-num" style={{color:kpiIcon("green")}}>{ldTotal.toFixed(3)}</div>
                <div className="rk-label">LĐ hôm nay <span className="rk-unit">đv</span></div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(255,214,10,0.12)"}}>📦</div>
              <div className="rk-info"><div className="rk-num" style={{color:kpiIcon("warn")}}>{khoTotal.toFixed(3)}</div>
                <div className="rk-label">Nhập kho <span className="rk-unit">bản</span></div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(255,149,0,0.12)"}}>👷</div>
              <div className="rk-info"><div className="rk-num" style={{color:kpiIcon("orange")}}>{cnTotal}</div>
                <div className="rk-label">Công nhật <span className="rk-unit">người</span></div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(76,217,100,0.12)"}}>✅</div>
              <div className="rk-info"><div className="rk-num" style={{color:kpiIcon("green")}}>{tasksDone}</div>
                <div className="rk-label">Công tác xong <span className="rk-unit">việc</span></div></div></div>
          </div>

          <div className="g2">
            <div className="rp-panel">
              <div className="rp-panel-header">🔧 Sản xuất</div>
              <div className="rp-panel-body">
                {Object.keys(prodByProject).length === 0 ? (
                  <div className="rp-empty"><div className="rp-empty-icon">📋</div><div className="rp-empty-text">Không có sản xuất trong ngày này</div></div>
                ) : Object.entries(prodByProject).map(([pname, logs]) => (
                  <div key={pname}>
                    <div className="rp-group-header">🏗️ {pname}</div>
                    <table style={{width:"100%", fontSize:12}}>
                      <thead><tr><th>Hạng mục</th><th>ĐVT</th><th style={{textAlign:"right"}}>KL</th><th>Ghi chú</th></tr></thead>
                      <tbody>
                        {logs.map(l => (
                          <tr key={l.id}>
                            <td>{l.itemName}</td><td>{l.unit}</td>
                            <td style={{textAlign:"right", color:"var(--blue)", fontWeight:600}}>{l.qty}</td>
                            <td className="text-t2">{l.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>

            <div className="rp-panel">
              <div className="rp-panel-header">📦 Nhập kho ({dayKho.length} bản ghi)</div>
              <div className="rp-panel-body">
                {dayKho.length === 0 ? (
                  <div className="rp-empty"><div className="rp-empty-icon">📦</div><div className="rp-empty-text">Không có nhập kho trong ngày này</div></div>
                ) : dayKho.map(e => {
                  const p = projects.find(x => x.id === e.projectId);
                  const item = ALL_ITEMS.find(x => x.id === e.itemId);
                  return (
                    <div key={e.id} className="rp-entry">
                      <span className="rp-left"><span style={{fontWeight:500}}>{p?.name || e.projectId}</span> – {item?.label || e.itemId}</span>
                      <span className="rp-right" style={{color:kpiIcon("warn")}}>{e.qty} {item?.unit || ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* === TAB 2: THEO KHOẢNG === */}
      {rtab === "khoang" && (
        <>
          <div className="cal-toolbar">
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <span className="text-sm text-t2">Từ</span>
              <input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} style={{maxWidth:160}} />
              <span className="text-sm text-t2">Đến</span>
              <input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)} style={{maxWidth:160}} />
            </div>
            <Button size="sm" variant="ghost" onClick={() => {
              const d = new Date(); const start = new Date(d); start.setDate(start.getDate() - start.getDay() + 1);
              setRangeFrom(fmtDate(start)); setRangeTo(fmtDate(d));
            }}>Tuần này</Button>
          </div>

          <div className="rp-kpi-grid">
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(0,0,0,0.06)"}}>📦</div>
              <div className="rk-info"><div className="rk-num">{sxTotalRange.toFixed(3)}</div>
                <div className="rk-label">SX tổng <span className="rk-unit">đv</span></div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(0,0,0,0.06)"}}>🔨</div>
              <div className="rk-info"><div className="rk-num">{ldTotalRange.toFixed(3)}</div>
                <div className="rk-label">LĐ tổng <span className="rk-unit">đv</span></div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(0,0,0,0.06)"}}>📋</div>
              <div className="rk-info"><div className="rk-num">{rangeDays}</div>
                <div className="rk-label">BC ngày</div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(0,0,0,0.06)"}}>✅</div>
              <div className="rk-info"><div className="rk-num">{tasks.filter(t => t.status === "done").length}</div>
                <div className="rk-label">CT xong</div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(0,0,0,0.06)"}}>👷</div>
              <div className="rk-info"><div className="rk-num">{cnTotalRange}</div>
                <div className="rk-label">Công nhật <span className="rk-unit">công-người</span></div></div></div>
          </div>

          <div className="g2">
            <div className="rp-panel">
              <div className="rp-panel-header">🔧 Sản xuất theo công trình</div>
              <div className="rp-panel-body">
                {Object.keys(sxByProject).length === 0 ? (
                  <div className="rp-empty"><div className="rp-empty-icon">📋</div><div className="rp-empty-text">Không có dữ liệu sản xuất</div></div>
                ) : Object.entries(sxByProject).sort((a, b) => b[1] - a[1]).map(([pname, qty]) => (
                  <div key={pname} className="rp-entry">
                    <span className="rp-left"><span style={{fontWeight:500}}>{pname}</span></span>
                    <span className="rp-right" style={{color:"var(--blue)"}}>{qty.toFixed(3)} <span className="rk-unit">đv</span></span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rp-panel">
              <div className="rp-panel-header">🔨 Lắp đặt theo công trình</div>
              <div className="rp-panel-body">
                {Object.keys(ldByProject).length === 0 ? (
                  <div className="rp-empty"><div className="rp-empty-icon">🔨</div><div className="rp-empty-text">Không có dữ liệu lắp đặt</div></div>
                ) : Object.entries(ldByProject).sort((a, b) => b[1] - a[1]).map(([pname, qty]) => (
                  <div key={pname} className="rp-entry">
                    <span className="rp-left"><span style={{fontWeight:500}}>{pname}</span></span>
                    <span className="rp-right" style={{color:"var(--green)"}}>{qty.toFixed(3)} <span className="rk-unit">đv</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* === TAB 3: BÁO CÁO CÔNG TÁC === */}
      {rtab === "congtac" && (
        <>
          <div className="cal-toolbar">
            <div style={{display:"flex", gap:4, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:3}}>
              <button className={`view-btn ${toggleDayWeek==="ngay"?"active":""}`} onClick={() => setToggleDayWeek("ngay")}>Ngày</button>
              <button className={`view-btn ${toggleDayWeek==="tuan"?"active":""}`} onClick={() => setToggleDayWeek("tuan")}>Tuần</button>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setTaskDate(navDate(taskDate, -1))}>◀</Button>
            <span className="ct-label">📅 {taskDate}</span>
            <Button size="sm" variant="ghost" onClick={() => setTaskDate(navDate(taskDate, 1))}>▶</Button>
            <Button size="sm" variant="ghost" onClick={() => setTaskDate(todayStr())}>Hôm nay</Button>
            <input type="date" value={taskDate} onChange={e => setTaskDate(e.target.value)} style={{maxWidth:160}} />
            <Button size="sm" style={{marginLeft:"auto"}} onClick={() => window.print()}>🖨️ In báo cáo ngày</Button>
          </div>

          <div className="rp-kpi-grid rp-kpi-grid-4">
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(76,217,100,0.12)"}}>✅</div>
              <div className="rk-info" style={{textAlign:"center"}}><div className="rk-num" style={{color:"var(--green)", fontSize:28}}>{tcDone}</div>
                <div className="rk-label">Hoàn thành</div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(108,140,255,0.12)"}}>🔵</div>
              <div className="rk-info" style={{textAlign:"center"}}><div className="rk-num" style={{color:"var(--blue)", fontSize:28}}>{tcDoing}</div>
                <div className="rk-label">Đang làm</div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(255,214,10,0.12)"}}>⏰</div>
              <div className="rk-info" style={{textAlign:"center"}}><div className="rk-num" style={{color:"var(--warn)", fontSize:28}}>{tcDueToday}</div>
                <div className="rk-label">Đến hạn hôm nay</div></div></div>
            <div className="rp-kpi"><div className="rk-icon" style={{background:"rgba(255,69,58,0.12)"}}>🔴</div>
              <div className="rk-info" style={{textAlign:"center"}}><div className="rk-num" style={{color:"var(--red)", fontSize:28}}>{tcOverdue}</div>
                <div className="rk-label">Quá hạn</div></div></div>
          </div>

          {filterTasks.length === 0 ? (
            <div className="rp-panel">
              <div className="rp-empty"><div className="rp-empty-icon" style={{fontSize:64}}>📌</div>
                <div className="rp-empty-text">Không có công tác nào trong ngày này</div></div>
            </div>
          ) : (
            <div className="rp-panel">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Tên công tác</th><th>Trạng thái</th><th>Hạn</th><th>Người làm</th></tr></thead>
                  <tbody>
                    {filterTasks.map(t => (
                      <tr key={t.id}>
                        <td style={{fontWeight:500}}>{t.name || "(chưa có tên)"}</td>
                        <td><span className={`badge ${t.status==="done"?"bg":t.status==="doing"?"bi":"bw"}`}>
                          {{done:"Xong", doing:"Đang", todo:"Chưa"}[t.status] || t.status}</span></td>
                        <td style={t.dueDate < todayStr() && t.status !== "done" ? {color:"var(--red)", fontWeight:600} : {}}>{t.dueDate || "—"}</td>
                        <td className="text-t2">{/* assigned name would go here */}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* === TAB 4: SAO LƯU & XUẤT === */}
      {rtab === "saoluu" && (
        <>
          <div className="bk-grid">
            <div className="bk-panel">
              <h3>💾 Sao lưu dữ liệu</h3>
              <div className="bk-desc">
                Dữ liệu lưu trong hệ thống ({dataSize} KB). ⚠ Nếu mất kết nối database sẽ ảnh hưởng đến dữ liệu.
              </div>
              <Button onClick={exportJSON} style={{width:"100%", marginBottom:10}}>
                ⬇ Xuất toàn bộ dữ liệu (.json)
              </Button>
              <Button variant="ghost" onClick={importJSON} style={{width:"100%"}}>
                ⬆ Nhập dữ liệu từ file .json
              </Button>
            </div>

            <div className="bk-panel">
              <h3>📊 Xuất Excel (CSV)</h3>
              <div className="bk-btn-list">
                {[
                  { table: "prod_logs", label: "Nhật ký sản xuất (.csv)", icon: "📦" },
                  { table: "inst_logs", label: "Nhật ký lắp đặt (.csv)", icon: "📦" },
                  { table: "tasks", label: "Danh sách công tác (.csv)", icon: "📦" },
                  { table: "cong_nhat", label: "Công nhật (.csv)", icon: "📦" },
                ].map(item => {
                  const count = (
                    item.table === "prod_logs" ? prodLogs :
                    item.table === "inst_logs" ? instLogs :
                    item.table === "tasks" ? tasks :
                    congNhat
                  ).length;
                  return (
                    <button key={item.table} className="bk-btn" onClick={() => exportCSV(item.table, `${item.table}-${todayStr()}.csv`)}>
                      <span className="bk-left"><span>{item.icon}</span> {item.label}</span>
                      <span className="bk-count">{count} bản ghi</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-12" style={{fontSize:15}}>📊 Tổng hợp dữ liệu hiện tại</h3>
            <div className="bk-mini-grid">
              {[
                { icon: "🏗️", label: "Công trình", num: projects.length },
                { icon: "👥", label: "Nhân sự", num: staff.length },
                { icon: "🏭", label: "Nhật ký SX", num: prodLogs.length },
                { icon: "🔧", label: "Nhật ký LĐ", num: instLogs.length },
                { icon: "📦", label: "Nhập kho", num: khoEntries.length },
                { icon: "📋", label: "Công nhật", num: congNhat.length },
                { icon: "📌", label: "Công tác", num: tasks.length },
              ].map(item => (
                <div key={item.label} className="bk-mini">
                  <div className="bm-icon">{item.icon}</div>
                  <div className="bm-label">{item.label}</div>
                  <div className="bm-num">{item.num}</div>
                </div>
              ))}
              <div className="bk-mini highlight">
                <div className="bm-icon">💾</div>
                <div className="bm-label">Dung lượng</div>
                <div className="bm-num">{dataSize} KB</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
