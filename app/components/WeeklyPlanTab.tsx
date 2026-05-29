"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Select } from "./ui/Select";
import { getMon, fmtDate, addDays, weekRangeStr, todayStr, uid } from "@/lib/utils";
import { ALL_ITEMS, PROD_ITEMS, INST_ITEMS } from "@/lib/constants";

interface Project { id: string; name: string; location: string; prodTargets: Record<string,number>; instCfg: Record<string,any>; personnel: Record<string,any>; sxDeadlines: Record<string,string>; ldDeadlines: Record<string,string>; prodBatches: Record<string,any>; }
interface ProdLog { id: string; date: string; projectId: string; itemId: string; qty: number; }
interface InstLog { id: string; date: string; projectId: string; itemId: string; qty: number; techStatus: string; }
interface KhoEntry { id: string; date: string; projectId: string; itemId: string; qty: number; }
interface StaffMember { id: string; name: string; role: string; }
interface Assignment { id: string; projectId: string; projectName: string; itemId: string; itemName: string; }

function r2(v: number) { return Math.round(v * 100) / 100; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export function WeeklyPlanTab() {
  const [mon, setMon] = useState(() => getMon(new Date()));
  const [projects, setProjects] = useState<Project[]>([]);
  const [prodLogs, setProdLogs] = useState<ProdLog[]>([]);
  const [instLogs, setInstLogs] = useState<InstLog[]>([]);
  const [kho, setKho] = useState<KhoEntry[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selDayIdx, setSelDayIdx] = useState(0);
  const [assignments, setAssignments] = useState<Record<string,Assignment[]>>({});
  const [personnelCount, setPersonnelCount] = useState<Record<string,number>>({});
  const [isContractor, setIsContractor] = useState<Record<string,boolean>>({});
  const [otSxHours, setOtSxHours] = useState<Record<string,string>>({});
  const [otLdHours, setOtLdHours] = useState<Record<string,string>>({});
  const [showOt, setShowOt] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStaff, setLeaveStaff] = useState("");
  const [leaveDate, setLeaveDate] = useState(todayStr());
  const [leaveReason, setLeaveReason] = useState("");
  const [leaves, setLeaves] = useState<any[]>([]);
  const MONTHLY_LEAVE_QUOTA = 4;

  const weekDates = useMemo(() => Array.from({length:7}, (_,i) => addDays(mon, i)), [mon]);
  const dayNames = ["T2","T3","T4","T5","T6","T7","CN"];
  const today = todayStr();

  const loadAll = useCallback(() => {
    Promise.all([
      fetch("/api/projects").then(r=>r.json()),
      fetch("/api/prod_logs").then(r=>r.json()),
      fetch("/api/inst_logs").then(r=>r.json()),
      fetch("/api/kho_entries").then(r=>r.json()),
      fetch("/api/staff").then(r=>r.json()),
      fetch("/api/leaves").then(r=>r.json()),
    ]).then(([p, pl, il, k, s, l]) => {
      setProjects(p); setProdLogs(pl); setInstLogs(il); setKho(k); setStaff(s); setLeaves(l);
    }).catch(()=>{});
  }, []);
  useEffect(loadAll, [loadAll]);

  // ===== BLOCK 1: PRODUCTION PLAN =====
  const prodPlan = useMemo(() => {
    const rows: {
      projectId: string; projectName: string; location: string;
      itemId: string; itemName: string; unit: string; dailyOutput: number;
      totalTarget: number; produced: number; remaining: number;
      deadline: string; dayQtys: number[]; weekTotal: number;
    }[] = [];

    for (const p of projects) {
      const targets: Record<string,number> = p.prodTargets || {};
      const deadlines: Record<string,string> = p.sxDeadlines || {};
      for (const [itemId, target] of Object.entries(targets)) {
        const def = ALL_ITEMS.find(x => x.id === itemId);
        if (!def || def.category !== "sx") continue;
        const produced = prodLogs
          .filter(l => l.projectId === p.id && l.itemId === itemId)
          .reduce((s, l) => s + l.qty, 0);
        const remaining = Math.max(0, target - produced);
        const deadline = deadlines[itemId] || "";
        const dayQtys: number[] = [];
        let toDist = remaining;
        for (let i = 0; i < 7; i++) {
          const q = toDist > 0 ? clamp(def.dailyOutput, 0, toDist) : 0;
          dayQtys.push(q);
          toDist -= q;
        }
        const weekTotal = dayQtys.reduce((s, v) => s + v, 0);
        rows.push({
          projectId: p.id, projectName: p.name, location: p.location,
          itemId, itemName: def.label, unit: def.unit, dailyOutput: def.dailyOutput,
          totalTarget: target, produced, remaining,
          deadline, dayQtys, weekTotal,
        });
      }
    }
    return rows;
  }, [projects, prodLogs]);

  const fixedPersonnel = useMemo(() => {
    const unique = new Set(prodPlan.map(r => r.dailyOutput));
    return unique.size === 1 ? unique.values().next().value : null;
  }, [prodPlan]);

  const prodPersonnel = useMemo(() => {
    const p = projects[0];
    const pers = p?.personnel?.sx || 6;
    return typeof pers === "number" ? pers : 6;
  }, [projects]);

  // ===== BLOCK 2: INSTALLATION PLAN =====
  const selDateStr = fmtDate(weekDates[selDayIdx]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignProject, setAssignProject] = useState("");
  const [assignItem, setAssignItem] = useState("");

  const dateAssignStatus = useMemo(() => {
    const status: string[] = [];
    for (let i = 0; i < 7; i++) {
      const ds = fmtDate(weekDates[i]);
      const list = assignments[ds] || [];
      status.push(list.length > 0 ? "Đã phân" : "Chưa phân");
    }
    return status;
  }, [weekDates, assignments]);

  const currentAssignments = assignments[selDateStr] || [];

  const availableItems = useMemo(() => {
    return projects.flatMap(p => {
      const cfg = p.instCfg || {};
      return Object.keys(cfg).map(itemId => {
        const def = ALL_ITEMS.find(x => x.id === itemId);
        return def?.category === "ld" ? { projectId: p.id, projectName: p.name, itemId, itemName: def.label } : null;
      }).filter(Boolean) as { projectId: string; projectName: string; itemId: string; itemName: string; }[];
    });
  }, [projects]);

  const existingKeys = new Set(currentAssignments.map(a => `${a.projectId}:${a.itemId}`));

  const filteredItems = useMemo(() => {
    return availableItems.filter(a => {
      if (assignProject && a.projectId !== assignProject) return false;
      return !existingKeys.has(`${a.projectId}:${a.itemId}`);
    });
  }, [availableItems, assignProject, existingKeys]);

  const openAssignModal = () => {
    setAssignProject("");
    setAssignItem("");
    setShowAssignModal(true);
  };

  const confirmAssignment = () => {
    const sel = filteredItems.find(a => a.itemId === assignItem);
    if (!sel) return;
    const newItem: Assignment = { id: uid(), ...sel };
    setAssignments(prev => ({ ...prev, [selDateStr]: [...(prev[selDateStr] || []), newItem] }));
    setShowAssignModal(false);
  };

  const removeAssignment = (id: string) => {
    setAssignments(prev => ({ ...prev, [selDateStr]: (prev[selDateStr] || []).filter(a => a.id !== id) }));
  };

  const setPersonnel = (n: number | "contractor") => {
    if (n === "contractor") {
      setIsContractor(prev => ({ ...prev, [selDateStr]: true }));
    } else {
      setIsContractor(prev => ({ ...prev, [selDateStr]: false }));
      setPersonnelCount(prev => ({ ...prev, [selDateStr]: n }));
    }
  };

  const curPersonnel = personnelCount[selDateStr] || 5;
  const curIsContractor = isContractor[selDateStr] || false;

  // ===== BLOCK 3: OVERTIME =====
  const delayedSx = useMemo(() => {
    return prodPlan.filter(r => r.remaining > 0 && r.deadline && r.deadline < today);
  }, [prodPlan, today]);

  const ldPlanItems = useMemo(() => {
    const items: {
      projectId: string; projectName: string; itemId: string; itemName: string; unit: string;
      dailyOutput: number; remaining: number; deadline: string; khoStatus: string;
    }[] = [];
    for (const p of projects) {
      const cfg: Record<string,any> = p.instCfg || {};
      const deadlines: Record<string,string> = p.ldDeadlines || {};
      for (const [itemId] of Object.entries(cfg)) {
        const def = ALL_ITEMS.find(x => x.id === itemId);
        if (!def || def.category !== "ld") continue;
        const installed = instLogs
          .filter(l => l.projectId === p.id && l.itemId === itemId)
          .reduce((s, l) => s + l.qty, 0);
        const target = typeof cfg[itemId] === "number" ? cfg[itemId] : 0;
        const remaining = Math.max(0, target - installed);
        if (remaining <= 0) continue;
        const khoQty = kho
          .filter(e => e.projectId === p.id && e.itemId === itemId)
          .reduce((s, e) => s + e.qty, 0);
        const khoStatus = khoQty >= remaining ? "Sẵn" : khoQty > 0 ? "⚠ Thiếu" : "⚠ Chờ nhập";
        items.push({
          projectId: p.id, projectName: p.name,
          itemId, itemName: def.label, unit: def.unit,
          dailyOutput: def.dailyOutput,
          remaining: r2(remaining),
          deadline: deadlines[itemId] || "",
          khoStatus,
        });
      }
    }
    return items;
  }, [projects, instLogs, kho]);

  const delayedLd = useMemo(() => {
    return ldPlanItems.filter(r => r.deadline && r.deadline < today);
  }, [ldPlanItems, today]);

  // ===== MONTHLY FLEXIBLE LEAVE =====
  const currentMonth = todayStr().slice(0, 7); // YYYY-MM
  const monthLeavesUsed = useMemo(() => {
    return leaves.filter(l =>
      l.date && l.date.startsWith(currentMonth) && l.status !== "cancelled"
    ).length;
  }, [leaves, currentMonth]);
  const leaveRemaining = Math.max(0, MONTHLY_LEAVE_QUOTA - monthLeavesUsed);

  // ===== LEAVE REGISTRATION =====
  const submitLeave = async () => {
    if (!leaveStaff || !leaveDate) return;
    const s = staff.find(x => x.id === leaveStaff);
    await fetch("/api/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: uid(), staffId: leaveStaff, staffName: s?.name || "",
        date: leaveDate, reason: leaveReason, note: "", status: "pending",
        createdAt: today,
      }),
    });
    setShowLeaveModal(false);
    setLeaveStaff(""); setLeaveDate(today); setLeaveReason("");
  };

  // ===== RENDER HELPERS =====
  const statusTag = (remaining: number, deadline: string) => {
    if (remaining <= 0) return <span className="badge bg">Hoàn thành</span>;
    if (deadline && deadline < today) return <span className="badge br">🚩 Đã trễ</span>;
    if (deadline) return <span className="badge bi">Đang làm</span>;
    return <span className="badge bw">Chưa có hạn</span>;
  };

  const otCalc = (dailyOutput: number, hours: string) => {
    const h = parseInt(hours) || 0;
    const extra = dailyOutput * h * 0.125;
    return { extra: r2(extra), multiplier: 1 + h * 0.125 };
  };

  return (
    <div>
      {/* HEADER */}
      <div className="cal-toolbar">
        <Button size="sm" variant="ghost" onClick={() => setMon(addDays(mon, -7))}>◀</Button>
        <span className="ct-label" style={{minWidth:200, fontSize:16}}>Tuần {weekRangeStr(mon)}</span>
        <Button size="sm" variant="ghost" onClick={() => setMon(getMon(new Date()))}>▶</Button>
        <Button size="sm" variant="ghost" onClick={() => setMon(getMon(new Date()))}>Tuần này</Button>
        <Button style={{marginLeft:"auto"}} onClick={() => setShowLeaveModal(true)}>📋 Đăng ký nghỉ phép</Button>
      </div>
      <div style={{fontSize:12, color:"var(--t2)", marginBottom:20, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap"}}>
        <span>📌 Lịch làm việc: <strong>7 ngày/tuần</strong>.</span>
        <span className="wp-leave-tracker">
          🏖️ Tháng này: <strong style={{color: leaveRemaining <= 0 ? "var(--red)" : "var(--green)"}}>{monthLeavesUsed}/{MONTHLY_LEAVE_QUOTA}</strong> ngày nghỉ linh động
          {leaveRemaining > 0 && <span style={{color:"var(--t2)"}}> (còn {leaveRemaining})</span>}
          {leaveRemaining <= 0 && <span style={{color:"var(--red)", marginLeft:4}}>⚠️ Hết phép!</span>}
        </span>
      </div>

      {/* ===== BLOCK 1: KẾ HOẠCH SẢN XUẤT ===== */}
      <div className="wp-block">
        <div className="wp-block-header">
          <div className="wph-left">
            <div className="wph-icon" style={{background:"var(--blue-bg)"}}>🔧</div>
            KẾ HOẠCH SẢN XUẤT
          </div>
        </div>
        <div className="wp-block-body">
          <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:8}}>
            <span className="wp-badge blue">👥 Cố định {prodPersonnel} người</span>
          </div>
          <div className="wp-note">Làm 7 ngày/tuần – nghỉ lễ theo lịch, tối đa 4 ngày linh động/tháng</div>

          <div className="wp-table-wrap" style={{marginTop:12}}>
            <table className="wp-table">
              <thead>
                <tr>
                  <th className="left" style={{minWidth:180}}>CT / Hạng mục</th>
                  <th style={{minWidth:55}}>ĐM/ng</th>
                  <th style={{minWidth:55}}>Tổng KL</th>
                  <th style={{minWidth:55}}>Đã SX</th>
                  <th style={{minWidth:55}}>Còn</th>
                  {weekDates.map((d, i) => (
                    <th key={i} className="day-cell" style={{
                      background: fmtDate(d) <= today ? "rgba(108,140,255,0.06)" : undefined,
                    }}>
                      {dayNames[i]}<br /><span style={{fontWeight:400, fontSize:9}}>{fmtDate(d).slice(5)}</span>
                    </th>
                  ))}
                  <th style={{minWidth:55}}>KH tuần</th>
                  <th style={{minWidth:60}}>TT</th>
                </tr>
              </thead>
              <tbody>
                {prodPlan.length === 0 ? (
                  <tr><td colSpan={16} style={{padding:30, textAlign:"center", color:"var(--t3)"}}>
                    Chưa có kế hoạch sản xuất. Thêm mục tiêu sản xuất trong Công trình.
                  </td></tr>
                ) : prodPlan.map((row, ri) => (
                  <tr key={`${row.projectId}-${row.itemId}`}>
                    <td className="left">
                      <div style={{color:"var(--blue)", fontWeight:600, fontSize:13}}>{row.projectName}</div>
                      <div className="wp-item-name">{row.itemName}</div>
                      {row.deadline && (
                        <div className="wp-deadline">📅 {row.deadline.slice(5)}/{row.deadline.slice(0,4)}</div>
                      )}
                    </td>
                    <td className="wp-count">{row.dailyOutput}</td>
                    <td className="wp-count">{row.totalTarget}</td>
                    <td className="wp-count">{r2(row.produced)}</td>
                    <td className="wp-count red" style={{fontWeight:700}}>{r2(row.remaining)}</td>
                    {row.dayQtys.map((q, di) => (
                      <td key={di} className={`day-cell${fmtDate(weekDates[di]) <= today ? " past" : ""}`}>
                        {q > 0 ? <span className="wp-count blue">{q}</span> : <span style={{color:"var(--t3)"}}>—</span>}
                      </td>
                    ))}
                    <td className="wp-count" style={{color:"var(--blue)"}}>{row.weekTotal}</td>
                    <td>{statusTag(row.remaining, row.deadline)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== BLOCK 2: KẾ HOẠCH LẮP ĐẶT ===== */}
      <div className="wp-block">
        <div className="wp-block-header">
          <div className="wph-left">
            <div className="wph-icon" style={{background:"var(--green-bg)"}}>🔨</div>
            KẾ HOẠCH LẮP ĐẶT
          </div>
        </div>
        <div className="wp-block-body">
          <div className="wp-note" style={{marginBottom:12}}>Chọn ngày → phân công người → giao nhiều công trình/ngày</div>

          {/* Date tabs */}
          <div className="wp-date-tabs">
            {weekDates.map((d, i) => {
              const ds = fmtDate(d);
              return (
                <button key={ds}
                  className={`wp-date-tab ${selDayIdx === i ? "active" : ""}`}
                  onClick={() => setSelDayIdx(i)}
                >
                  <span className="wdt-day">{dayNames[i]} {ds.slice(5)}</span>
                  <span className="wdt-status">{dateAssignStatus[i]}</span>
                </button>
              );
            })}
          </div>

          {/* Assignment area for selected date */}
          <div className="wp-assign-area">
            <div className="wp-assign-title">Phân công ngày {dayNames[selDayIdx]} {selDateStr.slice(5)}</div>

            <div className="wp-pers-grid">
              {[5, 7, 9].map(n => (
                <button key={n}
                  className={`wp-pers-btn ${!curIsContractor && curPersonnel === n ? "active" : ""}`}
                  onClick={() => setPersonnel(n)}
                >{n} người</button>
              ))}
              <button className={`wp-pers-btn contractor ${curIsContractor ? "active" : ""}`}
                onClick={() => setPersonnel("contractor")}
              >📄 Thuê khoán ngoài</button>
            </div>

            {currentAssignments.length === 0 ? (
              <div className="wp-empty-assign">
                <div className="wpea-icon">📋</div>
                <div>Chưa phân công. Bấm "+ Thêm phân công" để giao việc cho ngày này.</div>
              </div>
            ) : (
              <div className="wp-table-wrap">
                <table className="wp-table">
                  <thead><tr><th className="left">Công trình</th><th className="left">Hạng mục</th><th></th></tr></thead>
                  <tbody>
                    {currentAssignments.map(a => (
                      <tr key={a.id}>
                        <td style={{fontWeight:500}}>{a.projectName}</td>
                        <td className="wp-item-name">{a.itemName}</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={() => removeAssignment(a.id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="wp-assign-footer">
              <span className="wp-assign-progress">
                Đã phân: {currentAssignments.length}/{curIsContractor ? "Khoán" : curPersonnel} người
              </span>
              <Button size="sm" onClick={openAssignModal}>+ Thêm phân công</Button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BLOCK 3: ĐỀ XUẤT TĂNG CA ===== */}
      {(delayedSx.length > 0 || delayedLd.length > 0) && (
        <div className="wp-block overtime">
          <div className="wp-block-header">
            <div className="wph-left">
              <div className="wph-icon" style={{background:"rgba(255,149,0,0.12)"}}>⏰</div>
              ĐỀ XUẤT TĂNG CA – CÓ HẠNG MỤC CHẬM TIẾN ĐỘ
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowOt(!showOt)}>
              {showOt ? "▲ Thu gọn" : "▼ Mở rộng"}
            </button>
          </div>
          {showOt && (
            <div className="wp-block-body">
              <div className="wp-ot-row">Chọn số giờ tăng ca → hệ thống tự tính thêm sản lượng/ngày và số ngày tiết kiệm được.</div>

              {/* Sub-panel A: Production overtime */}
              {delayedSx.length > 0 && (
                <>
                  <div className="rp-group-header" style={{background:"var(--blue-bg)"}}>
                    🔧 Tổ sản xuất – {prodPersonnel} người
                  </div>
                  <div className="wp-ot-note">Mỗi +1h thêm ~12.5% sản lượng (8h chuẩn)</div>
                  <div className="wp-table-wrap">
                    <table className="wp-table">
                      <thead>
                        <tr>
                          <th className="left">Công trình / Hạng mục</th>
                          <th>Còn lại</th>
                          <th>ĐM/ng</th>
                          <th>Ngày cần</th>
                          <th>Số giờ tăng ca</th>
                          <th>Thêm/ng</th>
                          <th>Tiết kiệm</th>
                          <th>Ngày hạn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {delayedSx.map((row, ri) => {
                          const selHr = otSxHours[`${row.projectId}:${row.itemId}`] || "0";
                          const calc = otCalc(row.dailyOutput, selHr);
                          const daysNeeded = row.dailyOutput > 0 ? Math.ceil(row.remaining / row.dailyOutput) : 0;
                          const daysWithOt = calc.multiplier > 0 ? Math.ceil(row.remaining / (row.dailyOutput * calc.multiplier)) : 0;
                          const daysSaved = Math.max(0, daysNeeded - daysWithOt);
                          return (
                            <tr key={ri}>
                              <td className="left">
                                <div style={{fontWeight:500}}>{row.projectName}</div>
                                <div className="wp-item-name">{row.itemName}</div>
                              </td>
                              <td className="wp-count red">{r2(row.remaining)}</td>
                              <td className="wp-count">{row.dailyOutput} {row.unit}</td>
                              <td>{daysNeeded} ngày</td>
                              <td>
                                <div className="wp-ot-hours">
                                  {["0","1","2","3","4"].map(h => (
                                    <button key={h}
                                      className={`wp-ot-hour-btn ${selHr === h ? "active" : ""}`}
                                      onClick={() => setOtSxHours(prev => ({ ...prev, [`${row.projectId}:${row.itemId}`]: h }))}
                                    >{h === "0" ? "Không" : `+${h}h`}</button>
                                  ))}
                                </div>
                              </td>
                              <td className="wp-count blue">+{calc.extra} {row.unit}</td>
                              <td style={{color:"var(--green)", fontWeight:600}}>{daysSaved > 0 ? `${daysSaved} ngày` : "—"}</td>
                              <td>
                                {row.deadline}
                                <span className="badge br" style={{marginLeft:6}}>🚩 Đã trễ</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Sub-panel B: Installation overtime */}
              {delayedLd.length > 0 && (
                <>
                  <div className="rp-group-header" style={{background:"var(--green-bg)", marginTop:16}}>
                    🔨 Tổ lắp đặt – linh hoạt theo ngày
                  </div>
                  <div className="wp-ot-note">Tính trên số người phân công cho CT đó</div>
                  <div className="wp-table-wrap">
                    <table className="wp-table">
                      <thead>
                        <tr>
                          <th className="left">Công trình / Hạng mục</th>
                          <th>Còn lại</th>
                          <th>ĐM/ng (5ng)</th>
                          <th>Kho sẵn</th>
                          <th>Ngày cần</th>
                          <th>Số giờ tăng ca</th>
                          <th>Thêm/ng</th>
                          <th>Tiết kiệm</th>
                          <th>Ngày hạn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {delayedLd.map((row, ri) => {
                          const selHr = otLdHours[`${row.projectId}:${row.itemId}`] || "0";
                          const calc = otCalc(row.dailyOutput, selHr);
                          const daysNeeded = row.dailyOutput > 0 ? Math.ceil(row.remaining / row.dailyOutput) : 0;
                          const daysWithOt = calc.multiplier > 0 ? Math.ceil(row.remaining / (row.dailyOutput * calc.multiplier)) : 0;
                          const daysSaved = Math.max(0, daysNeeded - daysWithOt);
                          const isLocked = row.khoStatus.includes("Chờ");
                          return (
                            <tr key={ri}>
                              <td className="left">
                                <div style={{fontWeight:500}}>{row.projectName}</div>
                                <div className="wp-item-name">{row.itemName}</div>
                              </td>
                              <td className="wp-count red">{row.remaining}</td>
                              <td className="wp-count">{row.dailyOutput} {row.unit} - 5/5 ng</td>
                              <td>
                                <span className={`wp-kho-status ${row.khoStatus === "Sẵn" ? "ready" : row.khoStatus.includes("Thiếu") ? "empty" : "waiting"}`}>
                                  {row.khoStatus}
                                </span>
                              </td>
                              <td>{daysNeeded} ngày</td>
                              <td>
                                {isLocked ? (
                                  <span className="wp-ot-locked">⛔ Chờ nhập kho</span>
                                ) : (
                                  <div className="wp-ot-hours">
                                    {["0","1","2","3","4"].map(h => (
                                      <button key={h}
                                        className={`wp-ot-hour-btn ${selHr === h ? "active" : ""}`}
                                        onClick={() => setOtLdHours(prev => ({ ...prev, [`${row.projectId}:${row.itemId}`]: h }))}
                                      >{h === "0" ? "Không" : `+${h}h`}</button>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="wp-count blue">{isLocked ? "—" : `+${calc.extra} ${row.unit}`}</td>
                              <td style={{color:"var(--green)", fontWeight:600}}>{!isLocked && daysSaved > 0 ? `${daysSaved} ngày` : "—"}</td>
                              <td>
                                {row.deadline}
                                <span className="badge br" style={{marginLeft:6}}>🚩 Đã trễ</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== ASSIGNMENT MODAL ===== */}
        <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title="+ Thêm phân công lắp đặt">
          <div className="frm">
            <div className="frm-row">
              <div>
                <label>Công trình</label>
                <Select value={assignProject} onChange={e => { setAssignProject(e.target.value); setAssignItem(""); }}>
                  <option value="">-- Tất cả --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label>Hạng mục lắp đặt</label>
                <Select value={assignItem} onChange={e => setAssignItem(e.target.value)}>
                  <option value="">-- Chọn --</option>
                  {filteredItems.map(a => (
                    <option key={`${a.projectId}:${a.itemId}`} value={a.itemId}>
                      {a.projectName} – {a.itemName}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {filteredItems.length === 0 && (
              <div className="wp-empty-assign" style={{marginTop:8}}>
                <div className="wpea-icon">📋</div>
                <div>Không còn hạng mục lắp đặt nào để phân công cho ngày này.</div>
              </div>
            )}
            <div className="frm-actions">
              <Button variant="ghost" onClick={() => setShowAssignModal(false)}>Hủy</Button>
              <Button onClick={confirmAssignment} disabled={!assignItem}>Thêm</Button>
            </div>
          </div>
        </Modal>

      {/* ===== LEAVE MODAL ===== */}
        <Modal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="📋 Đăng ký nghỉ phép">
          <div className="frm">
            <div className="frm-row">
              <div>
                <label>Nhân sự</label>
                <Select value={leaveStaff} onChange={e => setLeaveStaff(e.target.value)}>
                  <option value="">-- Chọn --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </Select>
              </div>
              <div>
                <label>Ngày nghỉ</label>
                <input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label>Lý do</label>
              <input type="text" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Nhập lý do nghỉ..." />
            </div>
            <div className="frm-actions">
              <Button variant="ghost" onClick={() => setShowLeaveModal(false)}>Hủy</Button>
              <Button onClick={submitLeave}>Gửi đăng ký</Button>
            </div>
          </div>
        </Modal>
    </div>
  );
}
