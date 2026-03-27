"use client";

import { useEffect, useState } from "react";
import { Layers, Clock, GraduationCap, Plus, X, Users } from "lucide-react";

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", course_id: "", teacher_id: "", startTime: "", endTime: "" });

  function formatTime(time24) {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const date = new Date();
    date.setHours(parseInt(h, 10));
    date.setMinutes(parseInt(m, 10));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/teachers").then((r) => r.json()),
    ]).then(([b, c, t]) => {
      setBatches(Array.isArray(b) ? b : []);
      setCourses(Array.isArray(c) ? c : []);
      setTeachers(Array.isArray(t) ? t : []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const formattedTiming = `${formatTime(form.startTime)} - ${formatTime(form.endTime)}`;
    const payload = {
      name: form.name,
      course_id: form.course_id,
      teacher_id: form.teacher_id,
      timing: formattedTiming
    };

    const res = await fetch("/api/batches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", course_id: "", teacher_id: "", startTime: "", endTime: "" });
      const updated = await fetch("/api/batches").then((r) => r.json());
      setBatches(Array.isArray(updated) ? updated : []);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map((i) => <div key={i} className="h-36 animate-shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Batches</h1>
          <p className="page-subtitle">Manage class timings and assign teachers to courses.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`btn-primary ${showForm ? 'bg-gray-500 hover:bg-gray-600 !shadow-none' : ''}`}>
          {showForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> Add Batch</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Batch Name</label>
            <input placeholder="e.g. Morning Batch A" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Course</label>
            <select required value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="input-field">
              <option value="">Select Course</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Teacher</label>
            <select required value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className="input-field">
              <option value="">Select Teacher</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.user_id?.name || "Teacher"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Timing</label>
            <div className="flex items-center gap-2">
              <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-field" />
              <span className="text-gray-400 font-bold text-sm">to</span>
              <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-field" />
            </div>
          </div>
          <button type="submit" className="btn-primary sm:col-span-2 mt-2">Save Batch</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {batches.map((b) => (
          <div key={b._id} className="card hover:-translate-y-0.5 hover:shadow-lg transition-all group p-5">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Layers size={22} strokeWidth={2}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-gray-800 tracking-tight leading-tight truncate">{b.name}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{b.course_id?.name || "No Course"}</div>
              </div>
            </div>
            <div className="space-y-2.5 pt-4 border-t border-gray-100">
              <div className="flex items-center text-sm font-medium text-gray-600">
                <Clock size={15} className="text-gray-400 mr-2.5"/> {b.timing}
              </div>
              <div className="flex items-center text-sm font-medium text-gray-600">
                <GraduationCap size={15} className="text-gray-400 mr-2.5"/> {b.teacher_id?.user_id?.name || "Unassigned"}
              </div>
            </div>
          </div>
        ))}
        {batches.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <div className="w-14 h-14 bg-gray-100 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Layers size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-700">No batches created</h3>
            <p className="text-sm text-gray-500 mt-1">Create your first batch to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
