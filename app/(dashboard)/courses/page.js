"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, X, IndianRupee } from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", base_fee: "" });

  useEffect(() => {
    fetch("/api/courses").then((r) => r.json()).then((d) => setCourses(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", description: "", base_fee: "" });
        const updated = await fetch("/api/courses").then((r) => r.json());
        setCourses(Array.isArray(updated) ? updated : []);
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-shimmer rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Curriculum Management</h1>
          <p className="page-subtitle">{courses.length} educational program{courses.length !== 1 ? "s" : ""} currently available.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`btn-primary ${showForm ? "bg-gray-500 hover:bg-gray-600 !shadow-none" : ""}`}>
          {showForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> Add Course</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50/50 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Course Name</label>
            <input placeholder="e.g. JEE Mains Masterclass" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" disabled={creating} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Base Fee</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold">₹</span>
              <input type="number" placeholder="Amount" required value={form.base_fee} onChange={(e) => setForm({ ...form, base_fee: e.target.value })} className="input-field pl-8" disabled={creating} />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea placeholder="Course description & included features..." required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-24 resize-none" disabled={creating} />
          </div>
          <div className="md:col-span-2 flex justify-end">
             <button type="submit" className="btn-primary" disabled={creating}>{creating ? "Saving..." : "Save Course"}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((c) => (
          <div key={c._id} className="card hover:shadow-md transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-md group-hover:bg-slate-200 transition-colors">
                <BookOpen size={20} />
              </div>
              <div className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-semibold text-gray-600 flex items-center gap-1">
                <IndianRupee size={11} />
                {c.base_fee?.toLocaleString() || "0"}
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{c.name}</h3>
            <p className="text-gray-500 text-sm leading-relaxed flex-1 line-clamp-3">
              {c.description || "No description provided for this course yet."}
            </p>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-gray-100 text-gray-300 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BookOpen size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-700">No courses created</h3>
            <p className="text-sm text-gray-500 mt-1">Build your first curriculum to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
