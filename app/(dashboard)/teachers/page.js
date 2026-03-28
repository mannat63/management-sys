"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus, X, Mail, Pencil, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phoneOrEmail: "+91 " });
  const [role, setRole] = useState("");

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", phoneOrEmail: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/teachers").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ])
      .then(([d, m]) => {
        setTeachers(Array.isArray(d) ? d : []);
        setRole(m?.role || "STUDENT");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", phoneOrEmail: "+91 " });
      const updated = await fetch("/api/teachers").then((r) => r.json());
      setTeachers(Array.isArray(updated) ? updated : []);
      toast.success("Teacher added successfully");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to add teacher");
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/teachers/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await fetch("/api/teachers").then((r) => r.json());
        setTeachers(Array.isArray(updated) ? updated : []);
        setEditId(null);
        toast.success("Teacher updated");
      } else {
        const err = await res.json();
        toast.error(err.error || "Update failed");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this teacher? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTeachers((prev) => prev.filter((t) => t._id !== id));
        toast.success("Teacher deleted");
      } else {
        const err = await res.json();
        toast.error(err.error || "Delete failed");
      }
    } catch {
      toast.error("Network error");
    }
    setDeleting(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-lg" />
        {[1, 2].map((i) => (
          <div key={i} className="h-18 animate-shimmer rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="page-subtitle">
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""} on board
          </p>
        </div>
        {role === "ADMIN" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`btn-primary ${showForm ? "!bg-gray-500 hover:!bg-gray-600" : ""}`}
          >
            {showForm ? (
              <>
                <X size={16} /> Cancel
              </>
            ) : (
              <>
                <Plus size={16} /> Add Teacher
              </>
            )}
          </button>
        )}
      </div>

      {showForm && role === "ADMIN" && (
        <form
          onSubmit={handleSubmit}
          className="card bg-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Teacher Name
            </label>
            <input
              placeholder="Full name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Email / Phone
            </label>
            <input
              placeholder="Contact info"
              required
              value={form.phoneOrEmail}
              onChange={(e) => setForm({ ...form, phoneOrEmail: e.target.value })}
              className="input-field"
            />
          </div>
          <button type="submit" className="btn-primary h-[42px]">
            Save Teacher
          </button>
        </form>
      )}

      {/* Teacher Cards Grid */}
      {teachers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teachers.map((t) =>
            editId === t._id ? (
              /* ── Inline Edit Row ── */
              <form
                key={t._id}
                onSubmit={handleEdit}
                className="card flex flex-col gap-3 border-2 border-slate-300 bg-slate-50"
              >
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Editing Teacher</p>
                <div className="flex gap-3">
                  <input
                    required
                    placeholder="Full name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input-field flex-1"
                  />
                  <input
                    required
                    placeholder="Email / Phone"
                    value={editForm.phoneOrEmail}
                    onChange={(e) => setEditForm({ ...editForm, phoneOrEmail: e.target.value })}
                    className="input-field flex-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                  >
                    <Check size={13} />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            ) : (
              /* ── Normal Card ── */
              <div
                key={t._id}
                className="card flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-md bg-slate-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {(t.user_id?.name || "T")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 text-sm">
                    {t.user_id?.name || "—"}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <Mail size={11} />
                    {t.user_id?.phoneOrEmail || "—"}
                  </div>
                </div>
                <div className="badge badge-slate mr-1">Faculty</div>
                {role === "ADMIN" && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditId(t._id);
                        setEditForm({
                          name: t.user_id?.name || "",
                          phoneOrEmail: t.user_id?.phoneOrEmail || "",
                        });
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id)}
                      disabled={deleting === t._id}
                      className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      ) : (
        <div className="card py-16 text-center border-dashed">
          <div className="w-12 h-12 bg-gray-100 text-gray-300 rounded-lg flex items-center justify-center mx-auto mb-3">
            <GraduationCap size={24} />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">No teachers found</h3>
          <p className="text-sm text-gray-500 mt-1">Add your faculty members to get started.</p>
        </div>
      )}
    </div>
  );
}
