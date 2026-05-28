"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Select } from "./ui/Select";
import { uid, todayStr } from "@/lib/utils";
import { ROLES } from "@/lib/constants";

interface StaffMember {
  id: string; name: string; role: string; phone: string; note: string;
}

interface Leave {
  id: string; staffId: string; staffName: string; date: string;
  reason: string; note: string; status: string; createdAt: string;
}

export function StaffTab() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const load = () => {
    fetch("/api/staff").then(r=>r.json()).then(setStaff).catch(()=>{});
    fetch("/api/leaves").then(r=>r.json()).then(setLeaves).catch(()=>{});
  };

  useEffect(load, []);

  const saveStaff = async (s: StaffMember) => {
    await fetch("/api/staff", {
      method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(s),
    });
    setEditing(null);
    load();
  };

  const delStaff = async (id: string) => {
    if (!confirm("Xoá nhân sự này?")) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    load();
  };

  const updateLeave = async (id: string, status: string) => {
    const l = leaves.find(x => x.id === id);
    if (!l) return;
    await fetch(`/api/leaves/${id}`, {
      method: "PUT", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ ...l, status }),
    });
    load();
  };

  const delLeave = async (id: string) => {
    await fetch(`/api/leaves/${id}`, { method: "DELETE" });
    load();
  };

  const addLeave = async () => {
    const sid = (document.getElementById("lv-staff") as HTMLSelectElement)?.value;
    const date = (document.getElementById("lv-date") as HTMLInputElement)?.value;
    if (!sid || !date) return;
    const s = staff.find(x => x.id === sid);
    await fetch("/api/leaves", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ id: uid(), staffId: sid, staffName: s?.name || "", date, reason: "", note: "", status: "pending", createdAt: todayStr() }),
    });
    load();
  };

  const byRole = (role: string) => staff.filter(s => s.role === role);

  const statColor = (role: string) => {
    const colors: Record<string, string> = { kt: "blue", tssx: "green", tsld: "purple", cn: "warn" };
    return colors[role] || "blue";
  };

  return (
    <div>
      <h2 className="mb-16">Nhân sự</h2>

      <div className="card mb-16">
        <div className="frm-row">
          <div>
            <label>Họ tên</label>
            <input type="text" placeholder="Nhập họ tên" id="sf-name" />
          </div>
          <div>
            <label>Vai trò</label>
            <Select id="sf-role">
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </div>
          <div>
            <label>SĐT</label>
            <input type="tel" placeholder="Số điện thoại" id="sf-phone" />
          </div>
          <div>
            <label>Ghi chú</label>
            <input type="text" placeholder="Ghi chú" id="sf-note" />
          </div>
          <div>
            <label>&nbsp;</label>
            <Button onClick={() => {
              const name = (document.getElementById("sf-name") as HTMLInputElement).value;
              const role = (document.getElementById("sf-role") as HTMLSelectElement).value;
              const phone = (document.getElementById("sf-phone") as HTMLInputElement).value;
              const note = (document.getElementById("sf-note") as HTMLInputElement).value;
              if (!name) return;
              saveStaff({ id: uid(), name, role, phone, note });
              (document.getElementById("sf-name") as HTMLInputElement).value = "";
              (document.getElementById("sf-phone") as HTMLInputElement).value = "";
              (document.getElementById("sf-note") as HTMLInputElement).value = "";
            }}>+ Thêm</Button>
          </div>
        </div>
      </div>

      <div className="g2 mb-16">
        {Object.keys(ROLES).map(role => {
          const members = byRole(role);
          return (
            <div key={role} className="card">
              <h3 className="mb-8" style={{fontSize:15}}>{ROLES[role].label}</h3>
              <div className="text-2xl font-bold mb-8" style={{color:`var(--${statColor(role)})`}}>{members.length}</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Họ tên</th><th>SĐT</th><th>Ghi chú</th><th></th></tr></thead>
                  <tbody>
                    {members.map(s => (
                      <tr key={s.id}>
                        <td style={{fontWeight:500}}>{s.name}</td>
                        <td className="text-t2">{s.phone}</td>
                        <td className="text-t2">{s.note}</td>
                        <td>
                          <div className="flex gap-8" style={{justifyContent:"flex-end"}}>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>✏️</Button>
                            <Button size="sm" variant="danger" onClick={() => delStaff(s.id)}>✕</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-t2" style={{padding:20}}>Chưa có nhân sự</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3 className="mb-12" style={{fontSize:15}}>Nghỉ phép</h3>
        <div className="frm-row mb-12">
          <div>
            <label>Nhân viên</label>
            <Select id="lv-staff">
              <option value="">-- Chọn NV --</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <label>Ngày</label>
            <input type="date" id="lv-date" />
          </div>
          <div>
            <label>&nbsp;</label>
            <Button onClick={addLeave}>+ Thêm</Button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>NV</th><th>Ngày</th><th>Lý do</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {leaves.slice(0, 20).map(l => (
                <tr key={l.id}>
                  <td style={{fontWeight:500}}>{l.staffName}</td>
                  <td>{l.date}</td>
                  <td className="text-t2">{l.reason}</td>
                  <td>
                    <span className={`badge ${l.status === "approved" ? "bg" : l.status === "rejected" ? "br" : "bw"}`}>
                      {{pending:"Chờ duyệt", approved:"Đã duyệt", rejected:"Từ chối"}[l.status] || l.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-8" style={{justifyContent:"flex-end"}}>
                      {l.status === "pending" && <>
                        <Button size="sm" variant="success" onClick={() => updateLeave(l.id, "approved")}>Duyệt</Button>
                        <Button size="sm" variant="danger" onClick={() => updateLeave(l.id, "rejected")}>Từ chối</Button>
                      </>}
                      <Button size="sm" variant="ghost" onClick={() => delLeave(l.id)}>✕</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr><td colSpan={5} className="text-center text-t2" style={{padding:20}}>Chưa có đơn nghỉ phép</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Sửa nhân sự">
        {editing && (
          <div className="frm">
            <div>
              <label>Họ tên</label>
              <input type="text" value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} />
            </div>
            <div>
              <label>Vai trò</label>
              <Select value={editing.role} onChange={e => setEditing({...editing, role: e.target.value})}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </div>
            <div>
              <label>SĐT</label>
              <input type="text" value={editing.phone} onChange={e => setEditing({...editing, phone: e.target.value})} />
            </div>
            <div>
              <label>Ghi chú</label>
              <input type="text" value={editing.note} onChange={e => setEditing({...editing, note: e.target.value})} />
            </div>
            <div className="frm-actions">
              <Button variant="ghost" onClick={() => setEditing(null)}>Huỷ</Button>
              <Button onClick={() => saveStaff(editing)}>Lưu</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
