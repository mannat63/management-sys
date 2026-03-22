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
      // Pre-fill attendance from existing records
      const map = {};
      if (Array.isArray(a)) {
        a.forEach((rec) => { map[rec.student_id?._id || rec.student_id] = rec.status; });
      }
      if (Array.isArray(s)) {
        s.forEach((st) => { if (!map[st._id]) map[st._id] = "PRESENT"; });
      }
      setAttendance(map);
    });
  }, [selectedBatch, date]);

  function toggle(studentId) {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "PRESENT" ? "ABSENT" : "PRESENT",
    }));
  }

  async function markAll() {
    setSaving(true);
    for (const student of students) {
      await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: student._id,
          batch_id: selectedBatch,
          date,
          status: attendance[student._id] || "PRESENT",
        }),
      });
    }
    setSaving(false);
    toast.success("Attendance saved!");
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-24 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Mark daily presence and track student records.</p>
        </div>
      </div>

      <div className="card mb-6 bg-white">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Batch</label>
            <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="input-field shadow-sm">
              <option value="">-- Choose a Batch --</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field shadow-sm" />
          </div>
        </div>
      </div>

      {!selectedBatch && (
        <div className="card py-16 text-center bg-slate-50 border-dashed border-slate-200 shadow-none">
          <div className="w-16 h-16 mx-auto bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <CalendarCheck size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Select a batch to continue</h3>
          <p className="text-sm text-slate-500 mt-1">Choose a batch and date above to mark attendance.</p>
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
                    <td className="font-bold text-slate-800">{s.user_id?.name || s.parent_name}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${attendance[s._id] === "PRESENT" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                        {attendance[s._id] || "PRESENT"}
                      </span>
                    </td>
                    {role !== "STUDENT" && (
                    <td>
                      <button onClick={() => toggle(s._id)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1 rounded flex items-center gap-1 border border-indigo-100">
                        {attendance[s._id] === "PRESENT" ? "Mark Absent" : "Mark Present"}
                      </button>
                    </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {role !== "STUDENT" && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button onClick={markAll} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : <><Save size={16}/> Save Attendance</>}
            </button>
          </div>
          )}
        </div>
      )}

      {selectedBatch && students.length === 0 && (
        <div className="card py-16 text-center bg-slate-50 border-dashed border-slate-200 shadow-none">
          <div className="w-16 h-16 mx-auto bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No students found</h3>
          <p className="text-sm text-slate-500 mt-1">There are no students enrolled in this batch yet.</p>
        </div>
      )}
    </div>
  );
}
