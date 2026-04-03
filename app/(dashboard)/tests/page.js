"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, X, Calendar, ClipboardList, Save, CheckCircle, Bell, Send } from "lucide-react";
import toast from "react-hot-toast";

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
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/tests").then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ])
      .then(([t, b, m]) => {
        setTests(Array.isArray(t) ? t : []);
        setBatches(Array.isArray(b) ? b : []);
        setRole(m?.role || "STUDENT");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateTest(e) {
    e.preventDefault();
    const res = await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Test created successfully");
      setShowForm(false);
      setForm({ name: "", batch_id: "", date: "", total_marks: "" });
      const updated = await fetch("/api/tests").then((r) => r.json());
      setTests(Array.isArray(updated) ? updated : []);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create test");
    }
  }

  async function openResults(test) {
    setSelectedTest(test);
    setModalLoading(true);
    const [r, s] = await Promise.all([
      fetch(`/api/results?test_id=${test._id}`).then((r) => r.json()),
      fetch(`/api/students?batch_id=${test.batch_id?._id || test.batch_id}`).then((r) => r.json()),
    ]);
    setResults(Array.isArray(r) ? r : []);
    setStudents(Array.isArray(s) ? s : []);

    const marks = {};
    if (Array.isArray(r)) {
      r.forEach((res) => {
        marks[res.student_id?._id || res.student_id] = res.marks;
      });
    }
    setMarkForm(marks);
    setModalLoading(false);
  }

  function closeModal() {
    setSelectedTest(null);
    setResults([]);
    setStudents([]);
    setMarkForm({});
  }

  async function saveMarks() {
    setSaving(true);
    try {
      const saves = Object.entries(markForm)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([studentId, marks]) =>
          fetch("/api/results", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              test_id: selectedTest._id,
              student_id: studentId,
              marks: Number(marks),
            }),
          })
        );

      await Promise.all(saves);
      toast.success("Marks saved successfully");
      openResults(selectedTest);
    } catch {
      toast.error("Failed to save marks");
    }
    setSaving(false);
  }

  async function notifyParents(testId) {
    setNotifyingTestId(testId);
    try {
      const res = await fetch("/api/tests/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_id: testId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Notifications sent");
      } else {
        toast.error(data.error || "Failed to send notifications");
      }
    } catch (err) {
      toast.error("Network error while sending notifications");
    }
    setNotifyingTestId(null);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-shimmer rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{role === "STUDENT" ? "My Test Results" : "Tests and Results"}</h1>
          <p className="page-subtitle">
            {role === "STUDENT"
              ? "View all your test scores and performance records."
              : "Create exams, enter student marks, and view performance."}
          </p>
        </div>
        {role !== "STUDENT" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`btn-primary ${showForm ? "bg-gray-500 hover:bg-gray-600 !shadow-none" : ""}`}
          >
            {showForm ? (
              <>
                <X size={16} /> Cancel
              </>
            ) : (
              <>
                <Plus size={16} /> Create Test
              </>
            )}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateTest}
          className="card bg-gray-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Test Name
            </label>
            <input
              placeholder="e.g. Midterm 1"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Batch
            </label>
            <select
              required
              value={form.batch_id}
              onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
              className="input-field"
            >
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Date
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Total Marks
            </label>
            <input
              type="number"
              placeholder="e.g. 100"
              required
              value={form.total_marks}
              onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button type="submit" className="btn-primary">
              <CheckCircle size={15} /> Save Test
            </button>
          </div>
        </form>
      )}

      {/* Tests Grid */}
      <div>
        <h2 className="section-heading mb-4">Recent Tests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {tests.map((t) => (
            <div
              key={t._id}
              onClick={() => openResults(t)}
              className="card cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-slate-200"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-md bg-slate-100 text-slate-600 transition-colors">
                  <FileText size={18} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 text-base leading-tight truncate">{t.name}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {t.batch_id?.name || "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm font-medium pt-3 border-t border-gray-100 border-dashed">
                <span className="flex items-center text-gray-500 text-xs">
                  <Calendar size={13} className="mr-1.5" />
                  {new Date(t.date).toLocaleDateString()}
                </span>
                <span className="flex items-center text-gray-500 text-xs">
                  <ClipboardList size={13} className="mr-1.5" />
                  {t.total_marks} Marks
                </span>
              </div>
              {(role === "ADMIN" || role === "TEACHER") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    notifyParents(t._id);
                  }}
                  disabled={!!notifyingTestId}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                >
                  <Bell size={13} />
                  {notifyingTestId === t._id ? "Sending..." : "Notify Parents"}
                </button>
              )}
            </div>
          ))}
          {tests.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-lg">
              <FileText size={32} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-700">No tests created yet</h3>
              <p className="text-sm text-gray-500 mt-1">Create your first test to enter student marks.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Marks Modal Popup ─── */}
      {selectedTest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            style={{ animation: "slideDown 250ms cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/60">
              <div>
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <ClipboardList size={16} className="text-slate-600" />
                  {selectedTest.name}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Batch: {selectedTest.batch_id?.name || "—"} &nbsp;·&nbsp; Max: {selectedTest.total_marks} marks
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1">
              {modalLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                </div>
              ) : (
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
                        <td className="font-semibold text-gray-700">
                          {s.user_id?.name || s.parent_name}
                        </td>
                        <td>
                          {role !== "STUDENT" ? (
                            <>
                              <input
                                type="number"
                                max={selectedTest.total_marks}
                                min={0}
                                value={markForm[s._id] ?? ""}
                                onChange={(e) =>
                                  setMarkForm({ ...markForm, [s._id]: e.target.value })
                                }
                                className="w-24 px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500/15 focus:border-slate-400 transition-all font-mono"
                                placeholder="0"
                              />
                              <span className="text-gray-400 font-medium text-xs ml-2">
                                / {selectedTest.total_marks}
                              </span>
                            </>
                          ) : (
                            <span className="font-mono text-gray-800 font-bold bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                              {markForm[s._id] !== undefined ? markForm[s._id] : "—"}
                              <span className="text-gray-400 font-medium text-xs ml-1">
                                / {selectedTest.total_marks}
                              </span>
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
              )}
            </div>

            {/* Modal Footer */}
            {role !== "STUDENT" && !modalLoading && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                {(role === "ADMIN" || role === "TEACHER") && (
                  <button
                    onClick={() => notifyParents(selectedTest._id)}
                    disabled={!!notifyingTestId || students.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    <Send size={14} />
                    {notifyingTestId === selectedTest._id ? "Sending..." : "Notify All Parents"}
                  </button>
                )}
                <button
                  onClick={saveMarks}
                  disabled={saving || students.length === 0}
                  className="btn-primary w-full sm:w-auto"
                >
                  {saving ? "Saving..." : <><Save size={15} /> Save Marks</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
