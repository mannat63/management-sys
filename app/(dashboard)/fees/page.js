"use client";

import { useEffect, useState } from "react";
import { Wallet, Plus, X, IndianRupee, CheckCircle, Search, AlertCircle } from "lucide-react";
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
  
  // Defaulters state
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
        // Auto-confirm payment
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
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fees Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track student fee structures, due dates, and record payments.</p>
        </div>
        {role === "ADMIN" && (
          <button onClick={() => setShowForm(!showForm)} className={`btn-primary ${showForm ? "bg-slate-500 hover:bg-slate-600" : ""}`}>
            {showForm ? <><X size={18}/> Cancel</> : <><Plus size={18}/> Create Fee Record</>}
          </button>
        )}
      </div>
      
      {remindSuccess && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 shadow-sm font-bold animate-in fade-in zoom-in duration-200">
          <CheckCircle size={20} className="text-emerald-500" />
          {remindSuccess}
        </div>
      )}

      {/* ─── Defaulters Engine (Admin Only) ─── */}
      {role === "ADMIN" && defaulters.length > 0 && !showForm && (
        <div className="card !p-0 overflow-hidden ring-1 ring-rose-200 shadow-rose-100/50 shadow-xl mb-8 border-t-4 border-t-rose-500">
          <div className="bg-rose-500 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <AlertCircle size={20} /> Action Required: Fee Defaulters
              </h2>
              <p className="text-rose-100 text-sm mt-0.5 font-medium">{defaulters.length} students have overdue fees.</p>
            </div>
            <button 
              onClick={() => handleSendReminder(defaulters)} 
              disabled={reminding}
              className="bg-white text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors disabled:opacity-70"
            >
              {reminding ? "Sending..." : "Send Reminder to ALL"}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table !text-sm">
              <thead className="bg-rose-50/50">
                <tr>
                  <th className="!text-rose-900/70">Student</th>
                  <th className="!text-rose-900/70">Parent Phone</th>
                  <th className="!text-rose-900/70">Amount Due</th>
                  <th className="!text-rose-900/70">Due Date</th>
                  <th className="!text-rose-900/70">Status</th>
                  <th className="!text-rose-900/70 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100">
                {defaulters.map(d => {
                  const isCritical = d.days_overdue > 7;
                  return (
                    <tr key={d._id} className={isCritical ? "bg-rose-50/30" : "bg-amber-50/30"}>
                      <td className="font-bold text-slate-800">{d.name}</td>
                      <td className="font-mono text-slate-600">{d.parent_phone}</td>
                      <td className="font-mono font-bold text-rose-600">₹{d.due_amount.toLocaleString()}</td>
                      <td className="text-slate-500">{new Date(d.due_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black tracking-wide border ${isCritical ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                          {d.days_overdue > 0 ? `${d.days_overdue} DAYS LATE` : "DUE SOON"}
                        </span>
                      </td>
                      <td className="text-right">
                        <button 
                          onClick={() => handleSendReminder([d])}
                          disabled={reminding}
                          className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
                        >
                          Send Reminder
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
        <form onSubmit={handleCreateFee} className="card bg-slate-50 border border-slate-200 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shadow-none">
          <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="input-field lg:col-span-1">
            <option value="">Select Student</option>
            {students.map((s) => <option key={s._id} value={s._id}>{s.user_id?.name || s.parent_name}</option>)}
          </select>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 font-bold">₹</span>
            </div>
            <input type="number" placeholder="Total Amount" required value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} className="input-field pl-8" />
          </div>
          <input type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="input-field" />
          <div className="flex justify-end lg:col-span-1">
            <button type="submit" className="btn-primary w-full"><CheckCircle size={16}/> Save Fee</button>
          </div>
        </form>
      )}

      <div className="card !p-0 overflow-hidden ring-1 ring-slate-200 shadow-xl">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-white">
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
                <tr key={f._id} className="hover:bg-slate-50">
                  <td className="font-bold text-slate-800">{f.student_id?.user_id?.name || f.student_id?.parent_name || "—"}</td>
                  <td className="font-mono text-slate-600 font-medium">₹{f.total_amount?.toLocaleString() || 0}</td>
                  <td className="font-mono text-emerald-600 font-bold">₹{f.paid_amount?.toLocaleString() || 0}</td>
                  <td className="font-mono text-rose-600 font-bold">₹{f.due_amount?.toLocaleString() || 0}</td>
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border ${
                        f.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                        f.status === "PARTIAL" ? "bg-amber-50 text-amber-700 border-amber-200" : 
                        "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {f.status === "DUE" ? "UNPAID" : (f.status || "UNPAID")}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${f.status === 'PAID' ? 'text-slate-400' : 'text-rose-400'}`}>
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
                        <form onSubmit={handlePayment} className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <input 
                            type="number" 
                            placeholder="Amt" 
                            required 
                            max={f.due_amount}
                            className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm text-center font-mono focus:ring-2 focus:ring-teal-500 outline-none" 
                            onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })} 
                          />
                          <select 
                            value={payForm.method} 
                            onChange={(e) => setPayForm({ ...payForm, method: e.target.value })} 
                            className="w-24 px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                          >
                            <option value="CASH">CASH</option>
                            <option value="UPI">UPI</option>
                            <option value="BANK_TRANSFER">BANK</option>
                          </select>
                          <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded text-xs hover:bg-emerald-700 shadow-sm">Pay</button>
                          <button type="button" onClick={() => setShowPay(null)} className="px-2 py-1.5 text-slate-400 hover:text-slate-600 bg-white rounded border border-slate-200"><X size={14}/></button>
                        </form>
                      ) : (
                        <button 
                          onClick={() => {
                            setShowPay(f._id);
                            setPayForm({ fee_id: f._id, student_id: f.student_id?._id, amount: "", method: "CASH" });
                          }} 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          <IndianRupee size={14} className="text-teal-600" />
                          Record Pay
                        </button>
                      )
                    )}
                    {f.status === "PAID" && (
                       <span className="text-slate-400 text-sm font-medium italic flex items-center gap-1">
                         <CheckCircle size={14} /> Settled
                       </span>
                    )}
                  </td>
                  )}
                </tr>
              ))}
              {fees.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12">
                     <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
                        <Wallet size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700">No fee records found</h3>
                      <p className="text-sm text-slate-500 mt-1">Create fee records for your students to track payments.</p>
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
