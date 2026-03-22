"use client";

import { useEffect, useState } from "react";

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
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Teachers</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">
          {showForm ? "Cancel" : "+ Add Teacher"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input placeholder="Teacher Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Email / Phone" required value={form.phoneOrEmail} onChange={(e) => setForm({ ...form, phoneOrEmail: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">Save</button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Name</th>
              <th className="text-left px-4 py-3 font-semibold">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.map((t) => (
              <tr key={t._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{t.user_id?.name || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{t.user_id?.phoneOrEmail || "—"}</td>
              </tr>
            ))}
            {teachers.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400">No teachers found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
