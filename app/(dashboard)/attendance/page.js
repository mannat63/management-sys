"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CalendarCheck, Save, AlertCircle, Users, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const PAGE_SIZE = 15;

export default function AttendancePage() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedBatch, setSelectedBatch] = useState("");
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [date, setDate] = useState(todayStr);

  // Student specific state
  const [studentRecords, setStudentRecords] = useState([]);
  const [studentSearchDate, setStudentSearchDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [existingRecords, setExistingRecords] = useState([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/batches", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/me", { cache: "no-store" }).then((r) => r.json()),
    ]).then(async ([b, m]) => {
      if (b.error) {
        setBatches([]);
      } else {
        setBatches(Array.isArray(b) ? b : []);
      }
      const userRole = m.role || "STUDENT";
      setRole(userRole);

      if (userRole === "STUDENT") {
        try {
          const aRes = await fetch("/api/attendance", { cache: "no-store" }).then((r) => r.json());
          const sorted = (Array.isArray(aRes) ? aRes : []).sort(
            (x, y) => new Date(y.date) - new Date(x.date)
          );
          setStudentRecords(sorted);
        } catch (e) {
          console.error(e);
        }
      }
    })
      .catch((err) => console.error("Error in initial load:", err))
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
      else nextStatus = "PRESENT";
      return { ...prev, [studentId]: nextStatus };
    });
  }

  async function markAll() {
    setSaving(true);
    try {
      const records = students
        .map((student) => ({
          student_id: student._id,
          batch_id: selectedBatch,
          date,
          status: attendance[student._id] || "NOT_TAKEN",
        }))
        .filter((r) => r.status !== "NOT_TAKEN");

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
        body: JSON.stringify({ batch_id: selectedBatch, date }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Notifications sent!");
      } else {
        toast.error(data.error || "Failed to notify.");
      }
    } catch {
      toast.error("Network error.");
    }
    setNotifying(false);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="h-9 w-56 animate-shimmer rounded-lg" />
        <div className="h-28 animate-shimmer rounded-xl" />
        <div className="h-72 animate-shimmer rounded-xl" />
      </div>
    );
  }

  /* ───────────────── STUDENT VIEW ───────────────── */
  if (role === "STUDENT") {
    const totalDays = studentRecords.length;
    const presentDays = studentRecords.filter((r) => r.status === "PRESENT").length;
    const absentDays = studentRecords.filter((r) => r.status === "ABSENT").length;
    const pct = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : "0.0";
    const isGood = parseFloat(pct) >= 75;

    const filtered = studentSearchDate
      ? studentRecords.filter((r) => r.date.startsWith(studentSearchDate))
      : studentRecords;

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Page header ── */}
        <div>
          <h1 className="page-title">My Attendance</h1>
          <p className="page-subtitle">Your complete attendance record from admission to today.</p>
        </div>

        {/* ── Stat strip ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Overall % */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall</span>
            <div className={`text-3xl font-black mt-2 ${isGood ? "text-emerald-600" : "text-red-500"}`}>
              {pct}%
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isGood ? "bg-emerald-500" : "bg-red-400"}`}
                style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
              />
            </div>
            <span className={`text-[10px] font-semibold mt-1 ${isGood ? "text-emerald-600" : "text-red-500"}`}>
              {isGood ? "Good standing" : "Needs attention"}
            </span>
          </div>

          {/* Present */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Present</span>
            <div className="text-3xl font-black text-emerald-700 mt-2">{presentDays}</div>
            <span className="text-xs font-medium text-emerald-600 mt-1">days attended</span>
          </div>

          {/* Absent */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Absent</span>
            <div className="text-3xl font-black text-red-600 mt-2">{absentDays}</div>
            <span className="text-xs font-medium text-red-500 mt-1">out of {totalDays} days</span>
          </div>
        </div>

        {/* ── Table card ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Card header with search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <div>
              <h2 className="text-sm font-bold text-gray-800 tracking-tight">Attendance Log</h2>
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} records{studentSearchDate ? " matching your search" : ""}</p>
            </div>
            <div className="relative">
              <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={studentSearchDate}
                onChange={(e) => { setStudentSearchDate(e.target.value); setCurrentPage(1); }}
                className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/30">
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">#</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Batch</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((rec, idx) => {
                  const isPresent = rec.status === "PRESENT";
                  const isAbsent = rec.status === "ABSENT";
                  const rowNum = (safePage - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr key={rec._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-300">{rowNum}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-800">
                          {new Date(rec.date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs font-medium">
                        {batches.find((b) => b._id === rec.batch_id)?.name || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                          isPresent
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isAbsent
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}>
                          {isPresent ? <CheckCircle2 size={11} /> : isAbsent ? <XCircle size={11} /> : null}
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400">
                      <CalendarIcon size={28} className="mx-auto mb-3 text-gray-200" />
                      <p className="text-sm font-semibold">
                        {studentSearchDate ? "No records for this date." : "No attendance recorded yet."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
              <span className="text-xs text-gray-400 font-medium">
                Page {safePage} of {totalPages} &mdash; {filtered.length} total
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                  const pg = start + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        pg === safePage
                          ? "bg-slate-800 text-white shadow-sm"
                          : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ───────────────── ADMIN / TEACHER VIEW ───────────────── */
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">{role === "ADMIN" ? "Attendance Management" : "Daily Attendance"}</h1>
        <p className="page-subtitle">
          {role === "ADMIN" 
            ? "Monitor and verify student presence across all batches." 
            : "Mark presence for your assigned batch and notify absentees."}
        </p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Batch</label>
            <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="input-field">
              <option value="">— Choose a Batch —</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td className="font-semibold text-gray-800">{s.user_id?.name || s.parent_name}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                        attendance[s._id] === "PRESENT" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        attendance[s._id] === "ABSENT" ? "bg-red-50 text-red-600 border-red-200" :
                        "bg-gray-100 text-gray-500 border-gray-200"
                      }`}>
                        {attendance[s._id] === "PRESENT" ? <CheckCircle2 size={11}/> : attendance[s._id] === "ABSENT" ? <XCircle size={11}/> : null}
                        {attendance[s._id] === "NOT_TAKEN" ? "Not Marked" : attendance[s._id] || "Not Marked"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggle(s._id)}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-200 hover:bg-slate-100"
                      >
                        {attendance[s._id] === "NOT_TAKEN" ? "Mark" : attendance[s._id] === "PRESENT" ? "Mark Absent" : "Mark Present"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-end items-center gap-3">
            {(role === "ADMIN" || role === "TEACHER") && (
              <button onClick={notifyAbsentees} disabled={notifying || existingRecords.length === 0} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 w-full sm:w-auto">
                <AlertCircle size={15} />
                {notifying ? "Notifying..." : "Notify Absentees"}
              </button>
            )}
            <button onClick={markAll} disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? "Saving..." : <><Save size={15} /> Save Attendance</>}
            </button>
          </div>
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
