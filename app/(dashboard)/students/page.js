"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Users, Upload, Plus, X, Download, Pencil, Trash2, CheckCircle, AlertCircle, Search } from "lucide-react";

// ─── Toast Component ───
function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === "error" ? "toast-error" : "toast-success"}`}>
          {t.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Modal Component ───
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-full"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ───
function DeleteModal({ open, onClose, onConfirm, name, deleting }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-8 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trash2 size={22} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Student</h3>
          <p className="text-sm text-gray-500">
            Remove <span className="font-semibold text-gray-700">{name}</span>? This cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary" disabled={deleting}>Cancel</button>
          <button onClick={onConfirm} className="btn-danger" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState({ name: "", phoneOrEmail: "", batch_id: "", parent_name: "", parent_phone: "", admission_date: "", total_fee: "", due_date: "" });
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const fileRef = useRef(null);

  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [s, b, m] = await Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
    ]);
    setStudents(Array.isArray(s) ? s : []);
    setBatches(Array.isArray(b) ? b : []);
    setRole(m?.role || "STUDENT");
    setLoading(false);
  }

  function openAdd() {
    setEditingStudent(null);
    setForm({ name: "", phoneOrEmail: "", batch_id: "", parent_name: "", parent_phone: "", admission_date: "", total_fee: "", due_date: "" });
    setModalOpen(true);
  }
  function openEdit(s) {
    setEditingStudent(s);
    setForm({
      name: s.user_id?.name || "",
      phoneOrEmail: s.user_id?.phoneOrEmail || "",
      batch_id: s.batch_id?._id || s.batch_id || "",
      parent_name: s.parent_name || "",
      parent_phone: s.parent_phone || "",
      admission_date: s.admission_date ? new Date(s.admission_date).toLocaleDateString("en-CA") : "",
      total_fee: "",
      due_date: "",
    });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditingStudent(null); }

  async function handleSave(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingStudent ? `/api/students/${editingStudent._id}` : "/api/students";
      const method = editingStudent ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast(editingStudent ? "Student updated successfully" : "Student added successfully");
        closeModal();
        loadData();
      } else {
        const err = await res.json();
        toast(err.error || "Failed to save", "error");
      }
    } catch {
      toast("Network error", "error");
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${deleteTarget._id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Student removed");
        setDeleteTarget(null);
        loadData();
      } else {
        toast("Failed to delete", "error");
      }
    } catch {
      toast("Network error", "error");
    }
    setDeleting(false);
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileSelect(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  }

  function processSelectedFile(file) {
    if (!file.name.endsWith(".csv")) {
      return toast("Please upload a valid .csv file", "error");
    }
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const rows = text.split("\n").filter(r => r.trim());
      setCsvPreviewRows(rows.length > 1 ? rows.length - 1 : 0);
    };
    reader.readAsText(file);
  }

  async function handleConfirmCSV() {
    if (!csvFile) return;
    setCsvUploading(true);
    setCsvResult(null);
    const formData = new FormData();
    formData.append("file", csvFile);
    try {
      const res = await fetch("/api/students/import", { method: "POST", body: formData });
      const data = await res.json();
      setCsvResult(data);
      if (res.ok) {
        toast(`Imported ${data.imported || 0} students!`);
        setCsvModalOpen(false);
        setCsvFile(null);
        setCsvPreviewRows(null);
        loadData();
      } else {
        toast("Import completed with errors", "error");
      }
    } catch (err) {
      setCsvResult({ error: err.message });
      toast("CSV import failed", "error");
    }
    setCsvUploading(false);
  }

  const filtered = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.user_id?.name || "").toLowerCase().includes(q) ||
      (s.user_id?.phoneOrEmail || "").toLowerCase().includes(q) ||
      (s.batch_id?.name || "").toLowerCase().includes(q) ||
      (s.parent_name || "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-40 animate-shimmer rounded-xl" />
          <div className="h-10 w-32 animate-shimmer rounded-xl" />
        </div>
        <div className="card !p-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 animate-shimmer rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-shimmer rounded" />
                <div className="h-3 w-48 animate-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Toast toasts={toasts} />

      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">
            {students.length} student{students.length !== 1 ? "s" : ""} enrolled
          </p>
        </div>
        {role === "ADMIN" && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => setCsvModalOpen(true)} className="btn-secondary text-sm">
              <Upload size={15}/> Import CSV
            </button>
            <a href="/sample-students.csv" download className="btn-secondary text-sm">
              <Download size={15}/> Sample
            </a>
            <button onClick={openAdd} className="btn-primary">
              <Plus size={16}/> Add Student
            </button>
          </div>
        )}
      </div>

      {/* ─── CSV Result ─── */}
      {csvResult && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-start justify-between gap-4 border ${csvResult.error ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          <div>
            <div>{csvResult.error || csvResult.message}</div>
            {csvResult.errors?.length > 0 && (
              <ul className="mt-1 text-xs list-disc list-inside opacity-80">
                {csvResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
          <button onClick={() => setCsvResult(null)} className="text-xs font-bold underline opacity-70 hover:opacity-100 whitespace-nowrap">Dismiss</button>
        </div>
      )}

      {/* ─── Search ─── */}
      {students.length > 0 && (
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field !pl-10"
          />
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="card !p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Contact</th>
                <th>Batch</th>
                <th>Parent</th>
                <th>Phone</th>
                <th>Admitted</th>
                <th>Total Fee</th>
                {role === "ADMIN" && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr key={s._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                        {(s.user_id?.name || "?")[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-800">{s.user_id?.name || "—"}</span>
                    </div>
                  </td>
                  <td className="text-gray-500">{s.user_id?.phoneOrEmail || "—"}</td>
                  <td>
                    <span className="badge badge-indigo">
                      {s.batch_id?.name || "No Batch"}
                    </span>
                  </td>
                  <td className="text-gray-600">{s.parent_name || "—"}</td>
                  <td className="text-gray-500 font-mono text-xs">{s.parent_phone || "—"}</td>
                  <td className="text-gray-500 text-xs">
                    {s.admission_date ? new Date(s.admission_date).toLocaleDateString('en-GB') : "—"}
                  </td>
                  <td className="text-gray-700 font-bold text-xs tracking-wide">
                    ₹{s.total_fee?.toLocaleString() || "0"}
                  </td>
                  {role === "ADMIN" && (
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="btn-ghost !p-1.5 rounded-lg" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(s)} className="btn-ghost !p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && students.length > 0 && (
                <tr>
                  <td colSpan={role === "ADMIN" ? 8 : 7} className="py-10 text-center text-gray-400">
                    No students match "{search}"
                  </td>
                </tr>
              )}
              {students.length === 0 && (
                <tr>
                  <td colSpan={role === "ADMIN" ? 8 : 7} className="py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 bg-gray-100 text-gray-300 rounded-2xl flex items-center justify-center mb-4">
                        <Users size={28} />
                      </div>
                      <h3 className="text-base font-bold text-gray-700">No students yet</h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-xs">Add or import students to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add / Edit Modal ─── */}
      <Modal open={modalOpen} onClose={closeModal} title={editingStudent ? "Edit Student" : "Add New Student"}>
        <form onSubmit={handleSave}>
          <div className="modal-body space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Aarav Patel" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email or Phone</label>
              <input required value={form.phoneOrEmail} onChange={(e) => setForm({ ...form, phoneOrEmail: e.target.value })} className="input-field" placeholder="e.g. aarav@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Batch</label>
              <select required value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })} className="input-field">
                <option value="">Select batch...</option>
                {batches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Parent Name</label>
                <input required value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} className="input-field" placeholder="Parent name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Parent Phone</label>
                <input required value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} className="input-field" placeholder="+91..." />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Admission Date</label>
              <input type="date" value={form.admission_date} onChange={(e) => setForm({ ...form, admission_date: e.target.value })} className="input-field" />
            </div>
            {!editingStudent && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Total Course Fee</label>
                  <input type="number" required value={form.total_fee} onChange={(e) => setForm({ ...form, total_fee: e.target.value })} className="input-field" placeholder="e.g. 20000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fee Due Date</label>
                  <input type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="input-field" />
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={closeModal} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : editingStudent ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── CSV Import Modal ─── */}
      <Modal open={csvModalOpen} onClose={() => { setCsvModalOpen(false); setCsvFile(null); setCsvPreviewRows(null); setCsvResult(null); }} title="Import Students (CSV)">
        <div className="modal-body space-y-4">
          <div className="bg-gray-50 text-gray-600 text-sm p-3.5 rounded-xl border border-gray-200">
            <p className="font-bold text-gray-800 mb-1">Required Headers:</p>
            <code className="bg-white px-2.5 py-1 rounded-lg text-indigo-600 text-xs border border-gray-200 font-mono">name, parent_phone, batch_name, admission_date</code>
          </div>
          
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${dragActive ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white hover:bg-gray-50"} ${csvFile ? "border-emerald-400 bg-emerald-50" : ""}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            {csvFile ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-3"><CheckCircle size={24} /></div>
                <h3 className="font-bold text-gray-800">{csvFile.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Found {csvPreviewRows} row(s) inside.</p>
                <button onClick={() => { setCsvFile(null); setCsvPreviewRows(null); }} className="text-red-500 hover:text-red-700 text-xs font-bold mt-4 underline">Remove file</button>
              </div>
            ) : (
              <label className="flex flex-col items-center cursor-pointer">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-3"><Upload size={24} /></div>
                <h3 className="font-bold text-gray-700">Drag & Drop your CSV</h3>
                <p className="text-sm text-gray-500 mt-1">or click to browse your files</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
              </label>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={() => { setCsvModalOpen(false); setCsvFile(null); }} className="btn-secondary" disabled={csvUploading}>Cancel</button>
          <button onClick={handleConfirmCSV} className={`btn-primary ${!csvFile ? "opacity-50 cursor-not-allowed" : ""}`} disabled={!csvFile || csvUploading}>
            {csvUploading ? "Importing..." : "Confirm & Import"}
          </button>
        </div>
      </Modal>

      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        name={deleteTarget?.user_id?.name || "this student"}
        deleting={deleting}
      />
    </div>
  );
}
