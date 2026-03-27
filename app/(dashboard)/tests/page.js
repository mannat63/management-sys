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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 animate-shimmer rounded-2xl" />)}
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
          <h1 className="page-title">Tests & Results</h1>
          <p className="page-subtitle">Create exams, enter student marks, and view performance.</p>
        </div>
        {role !== "STUDENT" && (
          <button onClick={() => { setShowForm(!showForm); setSelectedTest(null); }} className={`btn-primary ${showForm ? "bg-gray-500 hover:bg-gray-600 !shadow-none" : ""}`}>
            {showForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> Create Test</>}
          </button>
        )}
      </div>

      {/* Notification Banner */}
      {notifyResult && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between gap-4 border ${
          notifyResult.success 
            ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
            : "bg-red-50 border-red-200 text-red-700"
        }`} style={{ animation: 'slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="flex items-center gap-2">
            {notifyResult.success ? <CheckCircle size={16} /> : <X size={16} />}
            {notifyResult.message}
          </div>
          <button onClick={() => setNotifyResult(null)} className="text-xs font-bold underline opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreateTest} className="card bg-gray-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Test Name</label>
            <input placeholder="e.g. Midterm 1" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Batch</label>
            <select required value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })} className="input-field">
              <option value="">Select Batch</option>
              {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Total Marks</label>
            <input type="number" placeholder="e.g. 100" required value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: e.target.value })} className="input-field" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button type="submit" className="btn-primary"><CheckCircle size={15}/> Save Test</button>
          </div>
        </form>
      )}

      {/* Tests Grid */}
      <div>
        <h2 className="section-heading mb-4">Recent Tests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {tests.map((t) => {
            const isSelected = selectedTest?._id === t._id;
            return (
              <div key={t._id} onClick={() => openResults(t)} className={`card cursor-pointer transition-all ${isSelected ? "ring-2 ring-indigo-400 bg-indigo-50/30 shadow-md" : "hover:-translate-y-0.5 hover:shadow-lg"}`}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl transition-colors ${isSelected ? "bg-indigo-100 text-indigo-700" : "bg-indigo-50 text-indigo-600"}`}>
                    <FileText size={18} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-800 text-base leading-tight truncate">{t.name}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t.batch_id?.name || "—"}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm font-medium pt-3 border-t border-gray-100 border-dashed">
                  <span className="flex items-center text-gray-500 text-xs"><Calendar size={13} className="mr-1.5"/> {new Date(t.date).toLocaleDateString()}</span>
                  <span className="flex items-center text-gray-500 text-xs"><ClipboardList size={13} className="mr-1.5"/> {t.total_marks} Marks</span>
                </div>
                {role === "ADMIN" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); notifyParents(t._id); }}
                    disabled={!!notifyingTestId}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Bell size={13} />
                    {notifyingTestId === t._id ? "Sending..." : "Notify Parents"}
                  </button>
                )}
              </div>
            );
          })}
          {tests.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
              <FileText size={32} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-700">No tests created yet</h3>
              <p className="text-sm text-gray-500 mt-1">Create your first test to enter student marks.</p>
            </div>
          )}
        </div>
      </div>

      {/* Marks Table */}
      {selectedTest && (
        <div className="card !p-0 overflow-hidden scroll-mt-6" id="marks-table">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-600"/> 
                Enter Marks for {selectedTest.name}
              </h2>
              <p className="text-sm text-gray-500">Batch: {selectedTest.batch_id?.name || "—"} • Max: {selectedTest.total_marks}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-2/3">Student Name</th>
                  <th>Marks Scored</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td className="font-semibold text-gray-700">{s.user_id?.name || s.parent_name}</td>
                    <td>
                      {role !== "STUDENT" ? (
                        <>
                          <input 
                            type="number" 
                            max={selectedTest.total_marks} 
                            min={0} 
                            value={markForm[s._id] ?? ""} 
                            onChange={(e) => setMarkForm({ ...markForm, [s._id]: e.target.value })} 
                            className="w-24 px-3 py-1.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 transition-all font-mono"
                            placeholder="0"
                          />
                          <span className="text-gray-400 font-medium text-xs ml-2">/ {selectedTest.total_marks}</span>
                        </>
                      ) : (
                        <span className="font-mono text-gray-800 font-bold bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                          {markForm[s._id] !== undefined ? markForm[s._id] : "-"} <span className="text-gray-400 font-medium text-xs ml-1">/ {selectedTest.total_marks}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-10 text-center text-gray-500 font-medium bg-gray-50/50">
                      No students enrolled in this batch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {role !== "STUDENT" && (
            <div className="p-4 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-gray-100 rounded-b-2xl">
              {role === "ADMIN" && (
                <button 
                  onClick={() => notifyParents(selectedTest._id)} 
                  disabled={!!notifyingTestId || students.length === 0} 
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                  {notifyingTestId === selectedTest._id ? "Sending..." : "Notify All Parents"}
                </button>
              )}
              <button onClick={saveMarks} disabled={saving || students.length === 0} className="btn-primary w-full sm:w-auto">
                {saving ? "Saving..." : <><Save size={15}/> Save Marks</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
