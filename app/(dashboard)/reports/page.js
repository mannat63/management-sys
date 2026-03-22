"use client";

import { useState, useEffect } from "react";
import { FileText, Download, TrendingUp, TrendingDown, Users, Wallet, CheckCircle, Calendar, AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [role, setRole] = useState(null);
  const [batches, setBatches] = useState([]);
  
  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(lastDay);
  const [batchId, setBatchId] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(data => {
      setRole(data.role || "STUDENT");
      if (data.role === "ADMIN") {
        fetch("/api/batches").then(r => r.json()).then(b => setBatches(b));
      }
      generateReport(data.role || "STUDENT");
    });
  }, []);



  async function handleSendWhatsApp() {
    if (!report || !report.students) return;
    if (!confirm(`Are you sure you want to send ${report.students.length} report cards via WhatsApp?`)) return;
    
    setSending(true);
    try {
      const res = await fetch("/api/reports/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFrom, dateTo, batchId })
      });
      if (res.ok) {
        toast.success("Reports dispatched to n8n successfully!");
      } else {
        toast.error("Failed to send reports.");
      }
    } catch (e) {
      toast.error("Error dispatching reports");
    }
    setSending(false);
  }

  async function generateReport(userRole = role) {
    setLoading(true);
    try {
      const endpoint = userRole === "ADMIN" ? "/api/reports/admin" : "/api/reports/student";
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (batchId && userRole === "ADMIN") params.append("batchId", batchId);

      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        toast.success("Report generated");
      } else {
        toast.error("Failed to load report");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error generating report");
    }
    setLoading(false);
  }

  function handleDownloadCSV() {
    const params = new URLSearchParams({ dateFrom, dateTo });
    if (batchId) params.append("batchId", batchId);
    window.location.href = `/api/reports/export/csv?${params.toString()}`;
  }

  function handlePrintPDF() {
    window.print();
  }

  if (!role) return <div className="p-8 text-slate-500 font-bold">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* ─── FILTERS (Hidden in print) ─── */}
      <div className="print:hidden bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-end justify-between">
        <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field max-w-[150px]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field max-w-[150px]" />
          </div>
          {role === "ADMIN" && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Batch (Optional)</label>
              <select value={batchId} onChange={e => setBatchId(e.target.value)} className="input-field max-w-[200px]">
                <option value="">All Batches</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={() => generateReport(role)} disabled={loading} className="btn-primary mb-0.5">
            {loading ? "Generating..." : "Apply Filters"}
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
          <button onClick={handlePrintPDF} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-sm tracking-wide rounded-xl border border-slate-300 shadow-sm flex items-center gap-2">
            <Download size={16} /> PDF
          </button>
          {role === "ADMIN" && (
            <>
              <button onClick={handleDownloadCSV} className="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-sm tracking-wide rounded-xl border border-teal-200 shadow-sm flex items-center gap-2">
                <FileText size={16} /> CSV
              </button>
              <button onClick={handleSendWhatsApp} disabled={sending || !report} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm tracking-wide rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50">
                {sending ? "Sending..." : "Send to Parents"}
              </button>
            </>
          )}
        </div>
      </div>

      {loading && <div className="h-64 bg-slate-100 animate-pulse rounded-2xl"></div>}



      {/* ─── PRINT HEADER (Visible only in print mode ideally, or both) ─── */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Institute Report</h1>
        <p className="text-sm font-bold text-slate-600 mt-1">Period: {new Date(dateFrom).toLocaleDateString()} to {new Date(dateTo).toLocaleDateString()}</p>
      </div>

      {/* ─── ADMIN REPORT VIEW ─── */}
      {!loading && report && role === "ADMIN" && (
        <div className="space-y-8">
          
          {/* OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-indigo-50 border-indigo-100 p-5">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Total Students</div>
              <div className="text-3xl font-black text-indigo-700 mt-1">{report.overview?.total_students || 0}</div>
            </div>
            <div className="card bg-emerald-50 border-emerald-100 p-5">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Revenue Collected</div>
              <div className="text-3xl font-black text-emerald-700 mt-1">₹{(report.overview?.total_revenue_collected || 0).toLocaleString()}</div>
            </div>
            <div className="card bg-rose-50 border-rose-100 p-5">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-widest">Pending Dues</div>
              <div className="text-3xl font-black text-rose-700 mt-1">₹{(report.overview?.pending_fees || 0).toLocaleString()}</div>
            </div>
            <div className="card bg-blue-50 border-blue-100 p-5">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Avg Attendance</div>
              <div className="text-3xl font-black text-blue-700 mt-1">{report.overview?.avg_attendance}%</div>
            </div>
          </div>

          {/* INSIGHTS MODULE */}
          <div className="card bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0 shadow-xl p-6 relative overflow-hidden">
             <div className="relative z-10">
               <h2 className="text-lg font-black tracking-wide flex items-center gap-2 mb-4 text-emerald-400">
                 <TrendingUp size={20} /> AI Insights
               </h2>
               <ul className="space-y-3 font-medium text-sm text-slate-300">
                 <li className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                   Administered <strong>{report.overview?.tests_conducted || 0}</strong> tests during this period.
                 </li>
                 <li className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                   <strong>{report.students.filter(s => s.fees.due > 0).length}</strong> students have pending fees.
                 </li>
                 <li className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                   Top performer overall: <strong>{report.students[0]?.tests?.taken > 0 ? report.students[0].student.name : "N/A"}</strong> ({report.students[0]?.tests?.percentage || 0}% avg).
                 </li>
               </ul>
             </div>
          </div>

          {/* STUDENT DATA TABLE */}
          <div className="card border border-slate-200 p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="font-bold text-slate-800">Detailed Student Aggregation</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table !text-sm">
                <thead className="bg-white">
                  <tr>
                    <th>Student Name</th>
                    <th>Batch</th>
                    <th className="text-right">Attendance</th>
                    <th className="text-right">Test Avg</th>
                    <th className="text-right">Rank</th>
                    <th className="text-right">Fee Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.students.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="font-bold text-slate-700">{row.student.name}</td>
                      <td className="text-slate-500 font-medium">{row.student.batch}</td>
                      <td className="text-right font-mono font-bold text-slate-600">{row.attendance.percentage}%</td>
                      <td className="text-right font-mono font-bold text-indigo-600">{row.tests.percentage}%</td>
                      <td className="text-right font-black tracking-widest text-slate-400">
                        {row.tests.rank !== "N/A" ? `#${row.tests.rank}` : "-"}
                      </td>
                      <td className={`text-right font-mono font-bold ${row.fees.due > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        ₹{row.fees.due.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {report.students.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400 font-medium">No student data found for this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─── STUDENT REPORT VIEW ─── */}
      {!loading && report && role === "STUDENT" && (
        <div className="space-y-6">
          
          {/* Header Card */}
          <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_#0f172a] relative overflow-hidden">
             <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                   <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase">{report.institute?.name || "Institute"}</h1>
                   <h2 className="text-xl font-bold text-teal-600 mt-1 uppercase tracking-widest leading-none">Official Report Card</h2>
                </div>
                <div className="text-right text-sm font-bold text-slate-500 border border-slate-200 px-3 py-1.5 rounded-lg">
                   Period: {new Date(dateFrom).toLocaleDateString()} to {new Date(dateTo).toLocaleDateString()}
                </div>
             </div>

             <div className="mt-8 grid grid-cols-2 gap-4 border-t-2 border-slate-100 pt-6">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</div>
                  <div className="text-xl font-bold text-slate-800">{report.student?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class / Batch</div>
                  <div className="text-xl font-bold text-slate-800">{report.student?.batch}</div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ATTENDANCE SECTION */}
            <div className="card p-6 border border-slate-200">
               <h3 className="text-lg font-black tracking-tighter mb-4 flex items-center gap-2 text-slate-800"><Calendar size={20} className="text-blue-500"/> Attendance Record</h3>
               
               <div className="flex items-center gap-6 mb-6">
                 <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center rounded-full border-8 border-slate-50 overflow-hidden shadow-inner">
                    {/* CSS Pie Chart Approximation */}
                    <div className="absolute inset-0 bg-blue-500" style={{ clipPath: report.attendance?.percentage > 50 ? 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 50%)' : 'polygon(50% 50%, 50% 0, 100% 0, 100% 50%)', opacity: 0.2 }}></div>
                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center z-10 flex-col">
                       <span className="text-xl font-black text-blue-600">{report.attendance?.percentage}%</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase">Classes</div>
                      <div className="text-lg font-bold text-slate-800 mt-1">{report.attendance?.total_days}</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-emerald-500 uppercase">Present</div>
                      <div className="text-lg font-bold text-slate-800 mt-1">{report.attendance?.present}</div>
                    </div>
                 </div>
               </div>
            </div>

            {/* FEES SECTION */}
            <div className="card p-6 border border-slate-200">
               <h3 className="text-lg font-black tracking-tighter mb-4 flex items-center gap-2 text-slate-800"><Wallet size={20} className="text-amber-500"/> Financial Summary</h3>
               <div className="space-y-3">
                 <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-500">Total Fees (Period)</span>
                    <span className="font-mono font-bold text-slate-800">₹{report.fees?.total.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <span className="text-sm font-bold text-emerald-600">Amount Paid</span>
                    <span className="font-mono font-bold text-emerald-700">₹{report.fees?.paid.toLocaleString()}</span>
                 </div>
                 <div className={`flex justify-between items-center p-3 rounded-xl border ${report.fees?.due > 0 ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"}`}>
                    <span className={`text-sm font-bold ${report.fees?.due > 0 ? "text-rose-600" : "text-slate-500"}`}>Outstanding Dues</span>
                    <span className={`font-mono font-black ${report.fees?.due > 0 ? "text-rose-700" : "text-slate-500"}`}>₹{report.fees?.due.toLocaleString()}</span>
                 </div>
               </div>
            </div>
          </div>

          {/* ACADEMIC SECTION */}
          <div className="card p-6 border border-slate-200">
            <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black tracking-tighter flex items-center gap-2 text-slate-800"><FileText size={20} className="text-indigo-500"/> Academic Performance</h3>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Average</div>
                <div className="text-2xl font-black text-indigo-600">{report.tests?.percentage}%</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-3 px-2">Test Name</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2 text-right">Score</th>
                    <th className="py-3 px-2 text-right">Rank in Batch</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {report.tests?.details.length > 0 ? report.tests.details.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-2 font-bold text-slate-700">{t.test_name}</td>
                      <td className="py-3 px-2 text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-indigo-600">{t.marks} / {t.total_marks} ({t.percentage}%)</td>
                      <td className="py-3 px-2 text-right font-black tracking-wrap text-slate-400 text-lg">#{t.rank}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-400 font-bold italic">No tests recorded in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="hidden print:block mt-12 text-center text-xs font-bold text-slate-300">
             Official computer-generated record for {report.student?.name}
          </div>

        </div>
      )}
    </div>
  );
}
