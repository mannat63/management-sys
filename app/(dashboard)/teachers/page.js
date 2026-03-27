"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus, X, Mail, User } from "lucide-react";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phoneOrEmail: "" });

  useEffect(() => {
    fetch("/api/teachers").then((r) => r.json()).then((d) => setTeachers(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await fetch("/api/teachers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", phoneOrEmail: "" });
      const updated = await fetch("/api/teachers").then((r) => r.json());
      setTeachers(Array.isArray(updated) ? updated : []);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-xl" />
        {[1, 2].map((i) => <div key={i} className="h-20 animate-shimmer rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">{teachers.length} teacher{teachers.length !== 1 ? "s" : ""} on board</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={`btn-primary ${showForm ? "bg-gray-500 hover:bg-gray-600 !shadow-none" : ""}`}>
          {showForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> Add Teacher</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50/50 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Teacher Name</label>
            <input placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email / Phone</label>
            <input placeholder="Contact info" required value={form.phoneOrEmail} onChange={(e) => setForm({ ...form, phoneOrEmail: e.target.value })} className="input-field" />
          </div>
          <button type="submit" className="btn-primary h-[42px]">Save Teacher</button>
        </form>
      )}

      {/* Teacher Cards Grid */}
      {teachers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teachers.map((t) => (
            <div key={t._id} className="card flex items-center gap-4 hover:-translate-y-0.5 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
                {(t.user_id?.name || "T")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-base">{t.user_id?.name || "—"}</div>
                <div className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                  <Mail size={12} />
                  {t.user_id?.phoneOrEmail || "—"}
                </div>
              </div>
              <div className="badge badge-indigo">Faculty</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card py-16 text-center border-dashed">
          <div className="w-14 h-14 bg-gray-100 text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-700">No teachers found</h3>
          <p className="text-sm text-gray-500 mt-1">Add your faculty members to get started.</p>
        </div>
      )}
    </div>
  );
}
