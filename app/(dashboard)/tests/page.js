"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, X, Calendar, ClipboardList, Save, CheckCircle, Bell, Send } from "lucide-react";

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", batch_id: "", date: "", total_marks: "" });
  const [selectedTest, setSelectedTest] = useState(null);
  const [markForm, setMarkForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState("");
  const [notifyingTestId, setNotifyingTestId] = useState(null);
  const [notifyResult, setNotifyResult] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/tests").then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ]).then(([t, b, m]) => {
      setTests(Array.isArray(t) ? t : []);
      setBatches(Array.isArray(b) ? b : []);
      setRole(m?.role || "STUDENT");
    }).finally(() => setLoading(false));
  }, []);

  async function handleCreateTest(e) {
    e.preventDefault();
    await fetch("/api/tests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    setForm({ name: "", batch_id: "", date: "", total_marks: "" });
    const updated = await fetch("/api/tests").then((r) => r.json());
    setTests(Array.isArray(updated) ? updated : []);
  }

  async function openResults(test) {
    setSelectedTest(test);
    const [r, s] = await Promise.all([
      fetch(`/api/results?test_id=${test._id}`).then((r) => r.json()),
      fetch(`/api/students?batch_id=${test.batch_id?._id || test.batch_id}`).then((r) => r.json()),
    ]);
    setResults(Array.isArray(r) ? r : []);
    setStudents(Array.isArray(s) ? s : []);
    
    // Pre-fill marks
    const marks = {};
    if (Array.isArray(r)) {
      r.forEach((res) => { marks[res.student_id?._id || res.student_id] = res.marks; });
    }
    setMarkForm(marks);
  }

  async function saveMarks() {
    setSaving(true);
    for (const studentId of Object.keys(markForm)) {
      if (markForm[studentId] !== undefined && markForm[studentId] !== "") {
        await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test_id: selectedTest._id, student_id: studentId, marks: Number(markForm[studentId]) }),
        });
      }
    }
    setSaving(false);
    openResults(selectedTest);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  async function notifyParents(testId) {
    setNotifyingTestId(testId);
    setNotifyResult(null);
    try {
      const res = await fetch("/api/tests/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_id: testId })
      });
      const data = await res.json();
      if (res.ok) {
        setNotifyResult({ success: true, message: data.message });
      } else {
        setNotifyResult({ success: false, message: data.error || "Failed to send notifications" });
      }
    } catch (err) {
      setNotifyResult({ success: false, message: "Network error while sending notifications" });
    }
    setNotifyingTestId(null);
    setTimeout(() => setNotifyResult(null), 6000);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tests & Results</h1>
          <p className="text-sm text-slate-500 mt-1">Create exams, enter student marks, and view performance.</p>
        </div>
        {role !== "STUDENT" && (
          <button onClick={() => { setShowForm(!showForm); setSelectedTest(null); }} className={`btn-primary ${showForm ? "bg-slate-500 hover:bg-slate-600" : ""}`}>
            {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Create Test</>}
          </button>
        )}
      </div>

      {/* Notification Banner */}
      {notifyResult && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center justify-between gap-4 border shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
          notifyResult.success 
            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
            : "bg-rose-50 border-rose-200 text-rose-700"
        }`}>
          <div className="flex items-center gap-2">
            {notifyResult.success ? <CheckCircle size={18} /> : <X size={18} />}
            {notifyResult.message}
          </div>
          <button onClick={() => setNotifyResult(null)} className="text-xs font-bold underline opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreateTest} className="card bg-slate-50 border border-slate-200 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shadow-none">
          <input placeholder="Test Name (e.g. Midterm 1)" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          <select required value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })} className="input-field">
            <option value="">Select Batch</option>
            {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
          <input type="number" placeholder="Total Marks" required value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: e.target.value })} className="input-field" />
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button type="submit" className="btn-primary"><CheckCircle size={16}/> Save Test</button>
          </div>
        </form>
      )}

      {/* Tests Grid */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Tests</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {tests.map((t) => {
          const isSelected = selectedTest?._id === t._id;
          return (
            <div key={t._id} onClick={() => openResults(t)} className={`card cursor-pointer transition-all ${isSelected ? "ring-2 ring-teal-500 bg-teal-50 shadow-md" : "hover:-translate-y-1 hover:shadow-md"}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-3 rounded-xl transition-colors ${isSelected ? "bg-teal-100 text-teal-700" : "bg-indigo-50 text-indigo-600"}`}>
                  <FileText size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-lg leading-tight">{t.name}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t.batch_id?.name || "—"}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm font-medium pt-3 border-t border-slate-100 border-dashed">
                <span className="flex items-center text-slate-500"><Calendar size={14} className="mr-1"/> {new Date(t.date).toLocaleDateString()}</span>
                <span className="flex items-center text-slate-500"><ClipboardList size={14} className="mr-1"/> {t.total_marks} Marks</span>
              </div>
              {role === "ADMIN" && (
                <button
                  onClick={(e) => { e.stopPropagation(); notifyParents(t._id); }}
                  disabled={!!notifyingTestId}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Bell size={14} />
                  {notifyingTestId === t._id ? "Sending..." : "Notify Parents"}
                </button>
              )}
            </div>
          );
        })}
        {tests.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
            <FileText size={32} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No tests created yet</h3>
            <p className="text-sm text-slate-500 mt-1">Create your first test to enter student marks.</p>
          </div>
        )}
      </div>

      {/* Target Result Entry Area */}
      {selectedTest && (
        <div className="card !p-0 overflow-hidden ring-1 ring-slate-200 shadow-xl scroll-mt-6" id="marks-table">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList size={20} className="text-teal-600"/> 
                Enter Marks for {selectedTest.name}
              </h2>
              <p className="text-sm text-slate-500 font-medium">Batch: {selectedTest.batch_id?.name || "—"} • Max Marks: {selectedTest.total_marks}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="bg-white">
                <tr>
                  <th className="w-2/3">Student Name</th>
                  <th>Marks Scored</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="font-bold text-slate-700">{s.user_id?.name || s.parent_name}</td>
                    <td>
                      {role !== "STUDENT" ? (
                        <>
                          <input 
                            type="number" 
                            max={selectedTest.total_marks} 
                            min={0} 
                            value={markForm[s._id] ?? ""} 
                            onChange={(e) => setMarkForm({ ...markForm, [s._id]: e.target.value })} 
                            className="w-24 px-3 py-1.5 border border-slate-300 rounded-md text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-mono"
                            placeholder="0"
                          />
                          <span className="text-slate-400 font-medium text-xs ml-2 uppercase">/ {selectedTest.total_marks}</span>
                        </>
                      ) : (
                        <span className="font-mono text-slate-800 font-bold bg-slate-100 px-3 py-1 rounded-md">
                          {markForm[s._id] !== undefined ? markForm[s._id] : "-"} <span className="text-slate-400 font-medium text-xs ml-1 uppercase">/ {selectedTest.total_marks}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-slate-500 font-medium bg-slate-50/50">
                      No students enrolled in this test's batch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {role !== "STUDENT" && (
            <div className="p-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-slate-100">
              {role === "ADMIN" && (
                <button 
                  onClick={() => notifyParents(selectedTest._id)} 
                  disabled={!!notifyingTestId || students.length === 0} 
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Send size={15} />
                  {notifyingTestId === selectedTest._id ? "Sending Notifications..." : "Notify All Parents"}
                </button>
              )}
              <button onClick={saveMarks} disabled={saving || students.length === 0} className="btn-primary w-full sm:w-auto">
                {saving ? "Saving..." : <><Save size={16}/> Save Marks</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
