"use client";

import { useEffect, useState } from "react";
import { Wallet, Plus, X, IndianRupee, CheckCircle, Search, AlertCircle, Bell } from "lucide-react";
import toast from "react-hot-toast";

export default function FeesPage() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_id: "", total_amount: "", due_date: "" });
  const [payForm, setPayForm] = useState({ fee_id: "", student_id: "", amount: "", method: "CASH" });
  const [showPay, setShowPay] = useState(null);
  const [role, setRole] = useState("");
  
  const [defaulters, setDefaulters] = useState([]);
  const [reminding, setReminding] = useState(false);
  const [remindSuccess, setRemindSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [f, s, m, dRes] = await Promise.all([
      fetch("/api/fees").then((r) => r.json()),
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/defaulters").then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    setFees(Array.isArray(f) ? f : []);
    setStudents(Array.isArray(s) ? s : []);
    if (dRes && Array.isArray(dRes)) setDefaulters(dRes);
    setRole(m?.role || "STUDENT");
    setLoading(false);
  }

  async function handleCreateFee(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/fees", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(form) 
      });
      
      if (res.ok) {
        setShowForm(false);
        setForm({ student_id: "", total_amount: "", due_date: "" });
        loadData();
        toast.success("Fee record created successfully");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create fee record");
      }
    } catch (error) {
      toast.error("Network error saving fee");
    }
  }

  async function handlePayment(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payForm),
      });
      if (res.ok) {
        const payment = await res.json();
        try {
          const confirmRes = await fetch(`/api/payments/${payment._id}/confirm`, { method: "PUT" });
          const confirmData = await confirmRes.json();
          if (confirmRes.ok) {
             toast.success("Payment recorded and receipt sent to parent");
          } else {
             toast.error("Payment recorded but confirmation failed: " + (confirmData.error || "Internal Error"));
          }
        } catch (confirmErr) {
           toast.error("Payment recorded but confirmation failed: " + (confirmErr.message || "Internal Error"));
        }
        
        setShowPay(null);
        setPayForm({ fee_id: "", student_id: "", amount: "", method: "CASH" });
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to process payment");
      }
    } catch (error) {
      toast.error("Network error processing payment");
    }
  }

  async function handleSendReminder(studentArr) {
    if (!studentArr || studentArr.length === 0) return;
    setReminding(true);
    try {
      const res = await fetch("/api/defaulters/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fees: studentArr })
      });
      const data = await res.json();
      if (res.ok) {
        setRemindSuccess(`Sent ${data.sent} reminders successfully!`);
        setTimeout(() => setRemindSuccess(""), 4000);
      }
    } catch (e) {
      console.error(e);
    }
    setReminding(false);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-48 animate-shimmer rounded-xl" />
        <div className="h-64 animate-shimmer rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Fees Management</h1>
          <p className="page-subtitle">Track student fee structures, due dates, and record payments.</p>
        </div>
        {role === "ADMIN" && (
          <button onClick={() => setShowForm(!showForm)} className={`btn-primary ${showForm ? "bg-gray-500 hover:bg-gray-600 !shadow-none" : ""}`}>
            {showForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> Create Fee Record</>}
          </button>
        )}
      </div>
      
      {remindSuccess && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 font-semibold text-sm" style={{ animation: 'slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <CheckCircle size={18} className="text-emerald-500" />
          {remindSuccess}
        </div>
      )}

      {/* ─── Defaulters Engine ─── */}
      {role === "ADMIN" && defaulters.length > 0 && !showForm && (
        <div className="card !p-0 overflow-hidden border-red-200 shadow-sm mb-8">
          <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                <AlertCircle size={18} /> Fee Defaulters
              </h2>
              <p className="text-red-100 text-sm mt-0.5">{defaulters.length} students have overdue fees.</p>
            </div>
            <button 
              onClick={() => handleSendReminder(defaulters)} 
              disabled={reminding}
              className="bg-white text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-70"
            >
              {reminding ? "Sending..." : "Remind ALL"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table !text-sm">
              <thead className="bg-red-50/50">
                <tr>
                  <th className="!text-red-800/60">Student</th>
                  <th className="!text-red-800/60">Parent Phone</th>
                  <th className="!text-red-800/60">Amount Due</th>
                  <th className="!text-red-800/60">Due Date</th>
                  <th className="!text-red-800/60">Status</th>
                  <th className="!text-red-800/60 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map(d => {
                  const isCritical = d.days_overdue > 7;
                  return (
                    <tr key={d._id} className={isCritical ? "bg-red-50/20" : "bg-amber-50/20"}>
                      <td className="font-semibold text-gray-800">{d.name}</td>
                      <td className="font-mono text-gray-600">{d.parent_phone}</td>
                      <td className="font-mono font-bold text-red-600">₹{d.due_amount.toLocaleString()}</td>
                      <td className="text-gray-500">{new Date(d.due_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide border ${isCritical ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                          {d.days_overdue > 0 ? `${d.days_overdue} DAYS LATE` : "DUE SOON"}
                        </span>
                      </td>
                      <td className="text-right">
                        <button 
                          onClick={() => handleSendReminder([d])}
                          disabled={reminding}
                          className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                        >
                          Remind
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreateFee} className="card bg-gray-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Student</label>
            <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="input-field">
              <option value="">Select Student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.user_id?.name || s.parent_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Total Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold">₹</span>
              <input type="number" placeholder="Amount" required value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} className="input-field pl-8" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Due Date</label>
            <input type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="input-field" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full"><CheckCircle size={15}/> Save Fee</button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Total Fee</th>
                <th>Paid Amount</th>
                <th>Due Balance</th>
                <th>Status</th>
                {role === "ADMIN" && <th>Payment Action</th>}
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f._id}>
                  <td className="font-semibold text-gray-800">{f.student_id?.user_id?.name || f.student_id?.parent_name || "—"}</td>
                  <td className="font-mono text-gray-600">₹{f.total_amount?.toLocaleString() || 0}</td>
                  <td className="font-mono text-emerald-600 font-bold">₹{f.paid_amount?.toLocaleString() || 0}</td>
                  <td className="font-mono text-red-600 font-bold">₹{f.due_amount?.toLocaleString() || 0}</td>
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        f.status === "PAID" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : 
                        f.status === "PARTIAL" ? "bg-amber-50 text-amber-600 border-amber-200" : 
                        "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        {f.status === "DUE" ? "UNPAID" : (f.status || "UNPAID")}
                      </span>
                      <span className={`text-[10px] font-semibold ${f.status === 'PAID' ? 'text-gray-400' : 'text-red-400'}`}>
                        {(() => {
                          if (f.status === "PAID") {
                            const nextDue = new Date(f.due_date);
                            nextDue.setMonth(nextDue.getMonth() + 1);
                            const diff = Math.ceil((nextDue - new Date()) / (1000 * 60 * 60 * 24));
                            return diff > 0 ? `Next due in ${diff}d` : "Due soon";
                          } else {
                            const diff = Math.ceil((new Date() - new Date(f.due_date)) / (1000 * 60 * 60 * 24));
                            return diff > 0 ? `${diff}d overdue` : `Due in ${Math.abs(diff)}d`;
                          }
                        })()}
                      </span>
                    </div>
                  </td>
                  {role === "ADMIN" && (
                  <td>
                    {f.status !== "PAID" && (
                      showPay === f._id ? (
                        <form onSubmit={handlePayment} className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                          <input 
                            type="number" 
                            placeholder="Amt" 
                            required 
                            max={f.due_amount}
                            className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center font-mono focus:ring-2 focus:ring-indigo-500/15 outline-none" 
                            onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} 
                          />
                          <select 
                            value={payForm.method} 
                            onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} 
                            className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/15 outline-none"
                          >
                            <option value="CASH">CASH</option>
                            <option value="UPI">UPI</option>
                            <option value="BANK_TRANSFER">BANK</option>
                          </select>
                          <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700">Pay</button>
                          <button type="button" onClick={() => setShowPay(null)} className="px-2 py-1.5 text-gray-400 hover:text-gray-600 bg-white rounded-lg border border-gray-200"><X size={14}/></button>
                        </form>
                      ) : (
                        <button 
                          onClick={() => {
                            setShowPay(f._id);
                            setPayForm({ fee_id: f._id, student_id: f.student_id?._id, amount: "", method: "CASH" });
                          }} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
                        >
                          <IndianRupee size={13} className="text-indigo-600" />
                          Record Pay
                        </button>
                      )
                    )}
                    {f.status === "PAID" && (
                       <span className="text-gray-400 text-sm font-medium italic flex items-center gap-1">
                         <CheckCircle size={14} /> Settled
                       </span>
                    )}
                  </td>
                  )}
                </tr>
              ))}
              {fees.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16">
                     <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 bg-gray-100 text-gray-300 rounded-2xl flex items-center justify-center mb-4">
                        <Wallet size={24} />
                      </div>
                      <h3 className="text-base font-bold text-gray-700">No fee records found</h3>
                      <p className="text-sm text-gray-500 mt-1">Create fee records for your students.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
