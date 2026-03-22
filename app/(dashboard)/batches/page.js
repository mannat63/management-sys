"use client";

import { useEffect, useState } from "react";
import { Layers, Clock, GraduationCap, Plus, X } from "lucide-react";

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
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Batches</h1>
          <p className="text-slate-500 text-sm mt-1">Manage class timings and assign teachers to courses.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`btn-primary ${showForm ? 'bg-slate-500 hover:bg-slate-600' : ''}`}>
          {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Add Batch</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input placeholder="Batch Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          <select required value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="input-field">
            <option value="">Select Course</option>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select required value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className="input-field">
            <option value="">Select Teacher</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.user_id?.name || "Teacher"}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-field" />
            <span className="text-slate-400 font-bold">to</span>
            <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-field" />
          </div>
          <button type="submit" className="btn-primary sm:col-span-2 mt-2">Save Batch</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((b) => (
          <div key={b._id} className="card hover:-translate-y-1 transition-transform cursor-pointer group p-5">
            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Layers size={24} strokeWidth={2}/>
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-slate-800 tracking-tight leading-tight">{b.name}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{b.course_id?.name || "No Course"}</div>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center text-sm font-medium text-slate-600">
                <Clock size={16} className="text-slate-400 mr-3"/> {b.timing}
              </div>
              <div className="flex items-center text-sm font-medium text-slate-600">
                <GraduationCap size={16} className="text-slate-400 mr-3"/> {b.teacher_id?.user_id?.name || "Unassigned"}
              </div>
            </div>
          </div>
        ))}
        {batches.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 text-slate-500 mb-3">
              <Layers size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No batches created</h3>
            <p className="text-sm text-slate-500 mt-1">Get started by creating your first batch.</p>
          </div>
        )}
      </div>
    </div>
  );
}
