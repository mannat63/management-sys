"use client";

import { useEffect, useState } from "react";
import { Layers, Clock, GraduationCap, Plus, X, Users, Pencil, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", course_id: "", teacher_id: "", startTime: "", endTime: "" });
  const [role, setRole] = useState("");

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", course_id: "", teacher_id: "", startTime: "", endTime: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  function formatTime(time24) {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    const date = new Date();
    date.setHours(parseInt(h, 10));
    date.setMinutes(parseInt(m, 10));
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  function timeFrom12to24(timing) {
    // Try to parse timing like "9:00 AM - 10:30 AM" back to HH:MM pair
    if (!timing) return { startTime: "", endTime: "" };
    const parts = timing.split(" - ");
    if (parts.length !== 2) return { startTime: "", endTime: "" };
    function parse(t) {
      const [timePart, meridiem] = t.trim().split(" ");
      if (!timePart || !meridiem) return "";
      let [h, m] = timePart.split(":");
      h = parseInt(h, 10);
      if (meridiem.toUpperCase() === "PM" && h !== 12) h += 12;
      if (meridiem.toUpperCase() === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${m || "00"}`;
    }
    return { startTime: parse(parts[0]), endTime: parse(parts[1]) };
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/teachers").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ])
      .then(([b, c, t, m]) => {
        setBatches(Array.isArray(b) ? b : []);
        setCourses(Array.isArray(c) ? c : []);
        setTeachers(Array.isArray(t) ? t : []);
        setRole(m?.role || "STUDENT");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const formattedTiming = `${formatTime(form.startTime)} - ${formatTime(form.endTime)}`;
    const payload = { name: form.name, course_id: form.course_id, teacher_id: form.teacher_id, timing: formattedTiming };
    const res = await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: "", course_id: "", teacher_id: "", startTime: "", endTime: "" });
      const updated = await fetch("/api/batches").then((r) => r.json());
      setBatches(Array.isArray(updated) ? updated : []);
      toast.success("Batch created");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create batch");
    }
  }

  async function handleEditSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const formattedTiming = `${formatTime(editForm.startTime)} - ${formatTime(editForm.endTime)}`;
      const payload = {
        name: editForm.name,
        course_id: editForm.course_id,
        teacher_id: editForm.teacher_id,
        timing: formattedTiming,
      };
      const res = await fetch(`/api/batches/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await fetch("/api/batches").then((r) => r.json());
        setBatches(Array.isArray(updated) ? updated : []);
        setEditId(null);
        toast.success("Batch updated");
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
    if (!confirm("Delete this batch? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBatches((prev) => prev.filter((b) => b._id !== id));
        toast.success("Batch deleted");
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-shimmer rounded-lg" />
          ))}
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
        {role === "ADMIN" && (
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
                <Plus size={16} /> Add Batch
              </>
            )}
          </button>
        )}
      </div>

      {showForm && role === "ADMIN" && (
        <form onSubmit={handleSubmit} className="card bg-gray-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Batch Name
            </label>
            <input
              placeholder="e.g. Morning Batch A"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Course
            </label>
            <select
              required
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="input-field"
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Teacher
            </label>
            <select
              required
              value={form.teacher_id}
              onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              className="input-field"
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.user_id?.name || "Teacher"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Timing
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="input-field"
              />
              <span className="text-gray-400 font-bold text-sm">to</span>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary sm:col-span-2 mt-2">
            Save Batch
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {batches.map((b) =>
          editId === b._id ? (
            /* ── Inline Edit Card ── */
            <form
              key={b._id}
              onSubmit={handleEditSave}
              className="card border-2 border-slate-300 bg-slate-50 space-y-3"
            >
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Editing Batch</p>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Course
                </label>
                <select
                  required
                  value={editForm.course_id}
                  onChange={(e) => setEditForm({ ...editForm, course_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Teacher
                </label>
                <select
                  required
                  value={editForm.teacher_id}
                  onChange={(e) => setEditForm({ ...editForm, teacher_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.user_id?.name || "Teacher"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Timing
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    required
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    className="input-field"
                  />
                  <span className="text-gray-400 font-bold text-xs">to</span>
                  <input
                    type="time"
                    required
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
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
            <div key={b._id} className="card hover:shadow-md transition-all group p-5">
              <div className="flex items-start gap-4 mb-5">
                <div className="p-2.5 bg-slate-100 text-slate-600 rounded-md group-hover:bg-slate-200 transition-colors">
                  <Layers size={22} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-gray-800 tracking-tight leading-tight truncate">
                    {b.name}
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {b.course_id?.name || "No Course"}
                  </div>
                </div>
                {role === "ADMIN" && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        const times = timeFrom12to24(b.timing);
                        setEditId(b._id);
                        setEditForm({
                          name: b.name,
                          course_id: b.course_id?._id || "",
                          teacher_id: b.teacher_id?._id || "",
                          startTime: times.startTime,
                          endTime: times.endTime,
                        });
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(b._id)}
                      disabled={deleting === b._id}
                      className="p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2.5 pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm font-medium text-gray-600">
                  <Clock size={15} className="text-gray-400 mr-2.5" /> {b.timing}
                </div>
                <div className="flex items-center text-sm font-medium text-gray-600">
                  <GraduationCap size={15} className="text-gray-400 mr-2.5" />
                  {b.teacher_id?.user_id?.name || "Unassigned"}
                </div>
              </div>
            </div>
          )
        )}
        {batches.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-gray-100 text-gray-300 rounded-lg flex items-center justify-center mx-auto mb-3">
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
