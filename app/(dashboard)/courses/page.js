"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, X, IndianRupee } from "lucide-react";

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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">{courses.length} course{courses.length !== 1 ? "s" : ""} available</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`btn-primary ${showForm ? "bg-gray-500 hover:bg-gray-600 !shadow-none" : ""}`}>
          {showForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> Add Course</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50/50 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Course Name</label>
            <input placeholder="e.g. JEE Mains Masterclass" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Base Fee</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold">₹</span>
              <input type="number" placeholder="Amount" required value={form.base_fee} onChange={(e) => setForm({ ...form, base_fee: e.target.value })} className="input-field pl-8" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea placeholder="Course description & included features..." required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field min-h-24 resize-none" />
          </div>
          <div className="md:col-span-2 flex justify-end">
             <button type="submit" className="btn-primary">Save Course</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((c) => (
          <div key={c._id} className="card hover:-translate-y-0.5 hover:shadow-lg transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <BookOpen size={20} />
              </div>
              <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 flex items-center gap-1">
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
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
            <div className="w-14 h-14 bg-gray-100 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
