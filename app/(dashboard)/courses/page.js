"use client";

import { useEffect, useState } from "react";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", base_fee: "" });

  useEffect(() => {
    fetch("/api/courses").then((r) => r.json()).then((d) => setCourses(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", description: "", base_fee: "" });
      const updated = await fetch("/api/courses").then((r) => r.json());
      setCourses(Array.isArray(updated) ? updated : []);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
          {showForm ? "Cancel" : "+ Add Course"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
          <input placeholder="Course Name (e.g. JEE Mains Masterclass)" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field md:col-span-1" />
          <div className="relative md:col-span-1">
            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
            <input type="number" placeholder="Base Fee Amount" required value={form.base_fee} onChange={(e) => setForm({ ...form, base_fee: e.target.value })} className="input-field pl-8" />
          </div>
          <textarea placeholder="Course Description & Included Features..." required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field md:col-span-2 min-h-24 resize-none" />
          <div className="md:col-span-2 flex justify-end">
             <button type="submit" className="btn-primary">Save Course</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div key={c._id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-100 transition-colors">
                <span className="text-xl">📚</span>
              </div>
              <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-xs font-bold text-slate-500 tracking-wider">
                ₹{c.base_fee?.toLocaleString() || "0"}
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{c.name}</h3>
            <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-3">
              {c.description || "No description provided for this course yet."}
            </p>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
            <h3 className="text-lg font-bold text-slate-700">No courses created</h3>
            <p className="text-sm text-slate-500 mt-2">Get started by building your first curriculum.</p>
          </div>
        )}
      </div>
    </div>
  );
}
