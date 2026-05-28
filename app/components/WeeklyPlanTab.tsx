"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/Button";
import { getMon, weekRangeStr, fmtDate, addDays } from "@/lib/utils";

interface StaffMember { id: string; name: string; role: string; }

export function WeeklyPlanTab() {
  const [mon, setMon] = useState(() => getMon(new Date()));
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [dropped, setDropped] = useState<Record<string, string[]>>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/staff").then(r=>r.json()).then(setStaff).catch(()=>{});
  }, []);

  const dates = Array.from({length:7}, (_,i) => addDays(mon, i));
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const handleDragStart = (id: string) => setDraggedItem(id);

  const handleDrop = (dateStr: string) => {
    if (!draggedItem) return;
    setDropped(prev => ({ ...prev, [dateStr]: [...(prev[dateStr] || []), draggedItem] }));
    setDraggedItem(null);
  };

  const removeFromDay = (dateStr: string, staffId: string) => {
    setDropped(prev => ({ ...prev, [dateStr]: (prev[dateStr] || []).filter(id => id !== staffId) }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-16">
        <h2>Kế hoạch tuần</h2>
        <div className="flex gap-8 items-center">
          <Button size="sm" variant="ghost" onClick={() => setMon(addDays(mon, -7))}>◀</Button>
          <span className="text-sm" style={{fontWeight:500, minWidth:160, textAlign:"center"}}>{weekRangeStr(mon)}</span>
          <Button size="sm" variant="ghost" onClick={() => setMon(addDays(mon, 7))}>▶</Button>
        </div>
      </div>

      <div className="card mb-16">
        <h3 className="mb-12" style={{fontSize:15}}>Điều phối nhân sự</h3>
        <p className="text-sm text-t2 mb-12">Kéo thả nhân sự vào từng ngày trong tuần</p>
        <div className="flex flex-wrap gap-8 mb-16" style={{padding:"8px 0"}}>
          {staff.map(s => (
            <div key={s.id} className="drag-item"
              draggable
              onDragStart={() => handleDragStart(s.id)}>
              {s.name} <span className="text-xs text-t2">({s.role})</span>
            </div>
          ))}
        </div>

        <div className="g3">
          {dates.map((d, i) => {
            const ds = fmtDate(d);
            const dayStaff = dropped[ds] || [];
            return (
              <div key={ds}
                className="drag-zone"
                onDrop={() => handleDrop(ds)}
                onDragOver={e => e.preventDefault()}
              >
                <div className="font-bold mb-8" style={{color:"var(--blue)", fontSize:13}}>
                  {dayNames[i]} <span className="text-xs text-t2" style={{fontWeight:400}}>({ds.slice(5)})</span>
                </div>
                {dayStaff.map(sid => {
                  const s = staff.find(x => x.id === sid);
                  return (
                    <div key={sid} className="drag-item" style={{cursor:"pointer", padding:"6px 10px", marginBottom:4}}>
                      {s?.name || sid}
                      <button className="btn btn-ghost btn-sm" style={{float:"right", padding:"2px 6px"}}
                        onClick={() => removeFromDay(ds, sid)}>✕</button>
                    </div>
                  );
                })}
                {dayStaff.length === 0 && <span className="text-xs text-t2">Kéo thả vào đây</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
