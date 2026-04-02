"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CalendarCheck, Search, Save, CheckCircle2, ChevronRight, CheckCircle, AlertCircle, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function AttendancePage() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedBatch, setSelectedBatch] = useState("");
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [date, setDate] = useState(todayStr);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [existingRecords, setExistingRecords] = useState([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/batches", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/me", { cache: "no-store" }).then((r) => r.json())
    ]).then(([b, m]) => {
      if (b.error) {
        console.error("Failed to fetch batches:", b.error);
        setBatches([]);
      } else {
        setBatches(Array.isArray(b) ? b : []);
      }
      setRole(m.role || "STUDENT");
    })
    .catch(err => console.error("Error in initial load:", err))
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    Promise.all([
      fetch(`/api/students?batch_id=${selectedBatch}`).then((r) => r.json()),
      fetch(`/api/attendance?batch_id=${selectedBatch}&date=${date}`).then((r) => r.json()),
    ]).then(([s, a]) => {
      setStudents(Array.isArray(s) ? s : []);
      setExistingRecords(Array.isArray(a) ? a : []);
      const map = {};
      if (Array.isArray(a)) {
        a.forEach((rec) => { map[rec.student_id?._id || rec.student_id] = rec.status; });
      }
      if (Array.isArray(s)) {
        s.forEach((st) => { if (!map[st._id]) map[st._id] = "NOT_TAKEN"; });
      }
      setAttendance(map);
    });
  }, [selectedBatch, date]);

  function toggle(studentId) {
    setAttendance((prev) => {
      const current = prev[studentId] || "NOT_TAKEN";
      let nextStatus = "NOT_TAKEN";
      if (current === "NOT_TAKEN") nextStatus = "PRESENT";
      else if (current === "PRESENT") nextStatus = "ABSENT";
      else nextStatus = "PRESENT"; // If absent, cycle back to present

      return {
        ...prev,
        [studentId]: nextStatus,
      };
    });
  }

  async function markAll() {
    setSaving(true);
    try {
      // Filter out NOT_TAKEN records
      const records = students.map((student) => ({
        student_id: student._id,
        batch_id: selectedBatch,
        date,
        status: attendance[student._id] || "NOT_TAKEN",
      })).filter(r => r.status !== "NOT_TAKEN");

      if (records.length === 0) {
        toast.error("No attendance marked. Click to toggle attendance.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      if (res.ok) {
        toast.success("Attendance saved!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save attendance");
      }
    } catch {
      toast.error("Network error saving attendance");
    }
    setSaving(false);
  }

  async function notifyAbsentees() {
    setNotifying(true);
    try {
      const res = await fetch("/api/attendance/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch_id: selectedBatch, date })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Notifications sent!");
      } else {
        toast.error(data.error || "Failed to notify.");
      }
    } catch (err) {
      toast.error("Network error.");
    }
    setNotifying(false);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-lg" />
        <div className="h-24 animate-shimmer rounded-lg" />
        <div className="h-64 animate-shimmer rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Mark daily presence and track student records.</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Batch</label>
            <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="input-field">
              <option value="">— Choose a Batch —</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
          </div>
        </div>
      </div>

      {!selectedBatch && (
        <div className="card py-16 text-center border-dashed border-gray-200">
          <div className="w-14 h-14 mx-auto bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 mb-3">
            <CalendarCheck size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-700">Select a batch to continue</h3>
          <p className="text-sm text-gray-500 mt-1">Choose a batch and date above to mark attendance.</p>
        </div>
      )}

      {selectedBatch && students.length > 0 && (
        <div className="card !p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Status</th>
                  {role !== "STUDENT" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td className="font-semibold text-gray-800">{s.user_id?.name || s.parent_name}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                        attendance[s._id] === "PRESENT" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                        attendance[s._id] === "ABSENT" ? "bg-red-50 text-red-600 border-red-200" :
                        "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {attendance[s._id] === "NOT_TAKEN" ? "NOT MARKED" : attendance[s._id] || "NOT MARKED"}
                      </span>
                    </td>
                    {role !== "STUDENT" && (
                    <td>
                      <button onClick={() => toggle(s._id)} className="text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors bg-slate-50 px-3 py-1.5 rounded-md flex items-center gap-1 border border-slate-200 hover:bg-slate-100">
                        {attendance[s._id] === "NOT_TAKEN" ? "Mark" : attendance[s._id] === "PRESENT" ? "Mark Absent" : "Mark Present"}
                      </button>
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {role !== "STUDENT" && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-end items-center gap-3">
            {(role === "ADMIN" || role === "TEACHER") && (
              <button onClick={notifyAbsentees} disabled={notifying || existingRecords.length === 0} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium rounded-md transition-colors disabled:opacity-50 w-full sm:w-auto">
                <AlertCircle size={15}/>
                {notifying ? "Notifying..." : "Notify Absentees"}
              </button>
            )}
            <button onClick={markAll} disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? "Saving..." : <><Save size={15}/> Save Attendance</>}
            </button>
          </div>
          )}
        </div>
      )}

      {selectedBatch && students.length === 0 && (
        <div className="card py-16 text-center border-dashed border-gray-200">
          <div className="w-14 h-14 mx-auto bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 mb-3">
            <Users size={32} />
          </div>
          <h3 className="text-base font-bold text-gray-700">No students found</h3>
          <p className="text-sm text-gray-500 mt-1">No students enrolled in this batch yet.</p>
        </div>
      )}
    </div>
  );
}
