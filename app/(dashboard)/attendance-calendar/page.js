"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Save, CheckCircle, AlertCircle, Calendar as CalendarIcon, X, Send } from "lucide-react";

import toast from "react-hot-toast";

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel !max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header border-b border-gray-100 flex items-center justify-between p-5">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="btn-ghost !p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="p-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AttendanceCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [loading, setLoading] = useState(true);

  const [panelDate, setPanelDate] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    fetch("/api/batches", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => {
        if (b.error) {
          console.error("Failed to fetch batches:", b.error);
          return;
        }
        const bList = Array.isArray(b) ? b : [];
        setBatches(bList);
        if (bList.length > 0) {
          setSelectedBatch(bList[0]._id);
        }
      })
      .catch(err => console.error("Error fetching batches:", err))
      .finally(() => setLoading(false));
  }, []);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  async function openPanel(dayDate) {
    if (!selectedBatch) return toast("Please select a batch first.", "error");

    const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
    setPanelDate(dayDate);
    
    const [sRes, aRes] = await Promise.all([
      fetch(`/api/students?batch_id=${selectedBatch}`).then(r => r.json()),
      fetch(`/api/attendance?batch_id=${selectedBatch}&date=${dateStr}`).then(r => r.json()),
    ]);
    
    const sList = Array.isArray(sRes) ? sRes : [];
    const aList = Array.isArray(aRes) ? aRes : [];
    
    const panelDayStr = dateStr;
    const eligibleStudents = sList.filter(st => {
      if (!st.admission_date) return true;
      const admStr = new Date(st.admission_date).toISOString().split("T")[0];
      return admStr <= panelDayStr;
    });

    setStudents(eligibleStudents);
    
    const map = {};
    aList.forEach(rec => { map[rec.student_id?._id || rec.student_id] = rec.status; });
    eligibleStudents.forEach(st => { if (!map[st._id]) map[st._id] = "PRESENT"; });
    
    setAttendance(map);
  }

  async function toggleStatus(studentId) {
    const newStatus = attendance[studentId] === "PRESENT" ? "ABSENT" : "PRESENT";
    setAttendance((prev) => ({ ...prev, [studentId]: newStatus }));
    
    if (!selectedBatch || !panelDate) return;
    const dateStr = `${panelDate.getFullYear()}-${String(panelDate.getMonth() + 1).padStart(2, '0')}-${String(panelDate.getDate()).padStart(2, '0')}`;
    
    try {
       await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          batch_id: selectedBatch,
          date: dateStr,
          status: newStatus,
        }),
      });
      toast.success(`Marked as ${newStatus}`, { id: studentId });
    } catch (e) {
      toast.error("Failed to sync status");
    }
  }

  async function savePanel() {
    if (!selectedBatch || !panelDate) return;
    setSaving(true);
    const dateStr = `${panelDate.getFullYear()}-${String(panelDate.getMonth() + 1).padStart(2, '0')}-${String(panelDate.getDate()).padStart(2, '0')}`;

    for (const student of students) {
      await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student._id,
          batch_id: selectedBatch,
          date: dateStr,
          status: attendance[student._id] || "PRESENT",
        }),
      });
    }
    
    setSaving(false);
    toast("Attendance successfully saved!");
  }

  async function notifyParents() {
    if (!selectedBatch || !panelDate) return;
    setNotifying(true);
    try {
      const dateStr = `${panelDate.getFullYear()}-${String(panelDate.getMonth() + 1).padStart(2, '0')}-${String(panelDate.getDate()).padStart(2, '0')}`;
      const res = await fetch("/api/attendance/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: selectedBatch, date: dateStr })
      });
      const data = await res.json();
      if (res.ok) {
        toast(data.message);
      } else {
        toast(data.error || "Failed to send notifications", "error");
      }
    } catch (err) {
      toast("Network error while sending notifications", "error");
    }
    setNotifying(false);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-9 w-64 animate-shimmer rounded-xl" />
        <div className="h-96 animate-shimmer rounded-2xl" />
      </div>
    );
  }

  const today = new Date();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <CalendarIcon className="text-indigo-600" size={28} />
            Attendance Calendar
          </h1>
          <p className="page-subtitle mt-2">View and modify attendance for any past or present date.</p>
        </div>
        
        <div className="w-full md:w-72">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Batch</label>
          <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="input-field">
            {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            {batches.length === 0 && <option value="">No batches available</option>}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200/70 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">
            {monthNames[month]} <span className="text-gray-400 font-semibold">{year}</span>
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
              Today
            </button>
            <button onClick={nextMonth} className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2.5">
            {days.map((dayDate, idx) => {
              if (!dayDate) return <div key={`empty-${idx}`} className="h-24 rounded-xl bg-gray-50/30 border border-gray-100 border-dashed" />;
              
              const isToday = dayDate.getDate() === today.getDate() && 
                              dayDate.getMonth() === today.getMonth() && 
                              dayDate.getFullYear() === today.getFullYear();
              
              return (
                <div
                  key={dayDate.toISOString()}
                  onClick={() => openPanel(dayDate)}
                  className={`relative h-24 rounded-xl border p-3 flex flex-col cursor-pointer transition-all duration-200 group
                    ${isToday ? 'border-indigo-400 bg-indigo-50/30 shadow-sm shadow-indigo-100' : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'}
                  `}
                >
                  <div className={`text-sm font-bold ${isToday ? 'text-indigo-600' : 'text-gray-700 group-hover:text-indigo-600'}`}>
                    {dayDate.getDate()}
                  </div>
                  
                  {isToday && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  )}

                  <div className="mt-auto">
                    <div className="text-[9px] font-bold text-gray-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to edit
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Attendance Edit Modal */}
      <Modal 
        open={!!panelDate} 
        onClose={() => setPanelDate(null)} 
        title={panelDate ? `Attendance: ${panelDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : "Attendance"}
      >
        <div className="overflow-y-auto max-h-[60vh]">
          {students.length === 0 ? (
            <div className="py-16 text-center bg-gray-50">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-700">No students found</h3>
              <p className="text-sm text-gray-500 mt-1">No students enrolled in the selected batch.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Student</th>
                  <th className="text-left px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Status</th>
                  <th className="text-right px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s, idx) => (
                  <tr key={s._id} className={idx % 2 === 1 ? "bg-gray-50/30" : "bg-white"}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                          {(s.user_id?.name || s.parent_name || "?")[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{s.user_id?.name || s.parent_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${attendance[s._id] === "PRESENT" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}`}>
                        {attendance[s._id] || "PRESENT"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => toggleStatus(s._id)}
                        className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all ${
                          attendance[s._id] === "PRESENT"
                            ? "bg-white text-red-600 border-gray-200 hover:border-red-200 hover:bg-red-50"
                            : "bg-white text-emerald-600 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50"
                        }`}
                      >
                        {attendance[s._id] === "PRESENT" ? "Mark Absent" : "Mark Present"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {students.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 rounded-b-2xl">
            <button 
              onClick={notifyParents} 
              disabled={notifying || saving} 
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {notifying ? "Sending..." : "Notify All Parents"}
            </button>
            <div className="flex gap-3">
              <button onClick={() => setPanelDate(null)} className="btn-secondary w-full sm:w-auto px-6">
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
