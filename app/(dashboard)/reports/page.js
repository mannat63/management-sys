"use client";

import { useState, useEffect } from "react";
import { FileText, Download, TrendingUp, TrendingDown, Users, Wallet, CheckCircle, Calendar, AlertCircle, X, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function ReportsPage() {
  const [role, setRole] = useState(null);
  const [batches, setBatches] = useState([]);
  
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
    fetch("/api/me").then(r => r.ok ? r.json() : null).then(data => {
      if (!data) return;
      setRole(data.role || "STUDENT");
      if (data.role === "ADMIN") {
        fetch("/api/batches")
          .then(r => r.ok ? r.json() : [])
          .then(b => setBatches(Array.isArray(b) ? b : []))
          .catch(() => setBatches([]));
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
        toast.success("Reports dispatched successfully!");
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

  if (!role) return <div className="p-8 text-gray-500 font-medium">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ─── FILTERS ─── */}
      <div className="print:hidden card flex flex-col md:flex-row gap-4 items-end justify-between">
        <div className="flex flex-wrap items-end gap-3 w-full md:w-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field max-w-[150px]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field max-w-[150px]" />
          </div>
          {role === "ADMIN" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Batch</label>
              <select value={batchId} onChange={e => setBatchId(e.target.value)} className="input-field max-w-[200px]">
                <option value="">All Batches</option>
                {Array.isArray(batches) && batches.map(b => (
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
          <button onClick={handlePrintPDF} className="btn-secondary text-sm">
            <Download size={15} /> PDF
          </button>
          {role === "ADMIN" && (
            <>
              <button onClick={handleDownloadCSV} className="btn-secondary text-sm">
                <FileText size={15} /> CSV
              </button>
              <button onClick={handleSendWhatsApp} disabled={sending || !report} className="btn-primary !bg-emerald-700 hover:!bg-emerald-800 text-sm disabled:opacity-50">
                {sending ? "Sending..." : <><Send size={14} /> Send to Parents</>}
              </button>
            </>
          )}
        </div>
      </div>

      {loading && <div className="h-64 animate-shimmer rounded-lg"></div>}

      {/* ─── PRINT HEADER ─── */}
      <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Institute Report</h1>
        <p className="text-sm font-medium text-gray-600 mt-1">Period: {new Date(dateFrom).toLocaleDateString()} to {new Date(dateTo).toLocaleDateString()}</p>
      </div>

      {/* ─── ADMIN REPORT ─── */}
      {!loading && report && role === "ADMIN" && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card bg-white border border-gray-200">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Students</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{report.overview?.total_students || 0}</div>
            </div>
            <div className="stat-card bg-white border border-gray-200">
              <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Revenue Collected</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">₹{(report.overview?.total_revenue_collected || 0).toLocaleString()}</div>
            </div>
            <div className="stat-card bg-white border border-gray-200">
              <div className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Pending Dues</div>
              <div className="text-2xl font-bold text-red-600 mt-2">₹{(report.overview?.pending_fees || 0).toLocaleString()}</div>
            </div>
            <div className="stat-card bg-white border border-gray-200">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Avg Attendance</div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{report.overview?.avg_attendance}%</div>
            </div>
          </div>

          {/* Insights */}
          <div className="card bg-slate-800 text-white border-0 p-5 relative overflow-hidden">
             <div className="relative z-10">
               <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2 mb-3 text-emerald-400 uppercase">
                 <TrendingUp size={15} /> Performance Summary
               </h2>
               <ul className="space-y-2 font-medium text-sm text-gray-300">
                 <li className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                   Administered <strong className="text-white">{report.overview?.tests_conducted || 0}</strong> tests in this period.
                 </li>
                 {report.overview?.top_performer && (
                   <li className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                     Overall topper: <strong className="text-white">{report.overview.top_performer.name}</strong> ({report.overview.top_performer.score}% avg).
                   </li>
                 )}
                 {report.overview?.batch_toppers?.length > 0 && (
                   <li className="flex flex-col gap-1.5 items-start">
                     <div className="flex items-center gap-2 mt-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                       <span className="text-gray-400 text-xs">Batch Toppers:</span>
                     </div>
                     <div className="flex flex-wrap gap-2 ml-3.5 mt-1">
                                               {Array.isArray(report.overview?.batch_toppers) && report.overview.batch_toppers.map((tp, i) => (

                         <div key={i} className="px-2 py-0.5 bg-white/10 rounded flex items-center gap-2 border border-white/5 shadow-sm">
                            <span className="text-[10px] text-gray-500 font-bold uppercase">{tp.batch}:</span>
                            <span className="text-xs font-bold text-emerald-400">{tp.name} ({tp.score}%)</span>
                         </div>
                       ))}
                     </div>
                   </li>
                 )}
               </ul>
             </div>
          </div>

          {/* Student Table */}
          <div className="card !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-800 text-sm">Detailed Student Aggregation</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table !text-sm">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Batch</th>
                    <th className="text-right">Attendance</th>
                    <th className="text-right">Test Avg</th>
                    <th className="text-right">Rank</th>
                    <th className="text-right">Fee Due</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(report?.students) && report.students.map((row, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-gray-700">{row.student.name}</td>
                      <td className="text-gray-500">{row.student.batch}</td>
                      <td className="text-right font-mono font-medium text-gray-600">{row.attendance.percentage}%</td>
                      <td className="text-right font-mono font-medium text-slate-700">{row.tests.percentage}%</td>
                      <td className="text-right font-medium text-gray-400">
                        {row.tests.rank !== "N/A" ? `#${row.tests.rank}` : "-"}
                      </td>
                      <td className={`text-right font-mono font-medium ${row.fees.due > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        ₹{row.fees.due.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {report.students.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 font-medium">No student data found for this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─── STUDENT REPORT CARD ─── */}
      {!loading && report && role === "STUDENT" && (
        <div className="space-y-5">
          
          {/* Header Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 relative overflow-hidden">
             <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                   <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{report.institute?.name || "Institute"}</h1>
                   <h2 className="text-sm font-semibold text-slate-600 mt-0.5 uppercase tracking-wider">Official Report Card</h2>
                </div>
                <div className="text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-md bg-gray-50">
                   {new Date(dateFrom).toLocaleDateString()} — {new Date(dateTo).toLocaleDateString()}
                </div>
             </div>

             <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-200 pt-5">
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Student Name</div>
                  <div className="text-lg font-semibold text-gray-800 mt-0.5">{report.student?.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Class / Batch</div>
                  <div className="text-lg font-semibold text-gray-800 mt-0.5">{report.student?.batch}</div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attendance */}
            <div className="card">
               <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-800"><Calendar size={16} className="text-slate-500"/> Attendance Record</h3>
               <div className="flex items-center gap-6 mb-4">
                 <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center rounded-full border-[3px] border-gray-200 overflow-hidden bg-gray-50">
                    <span className="text-lg font-bold text-slate-700">{report.attendance?.percentage}%</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2.5 flex-1">
                    <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase">Classes</div>
                      <div className="text-base font-bold text-gray-800 mt-0.5">{report.attendance?.total_days}</div>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-md border border-gray-100">
                      <div className="text-[10px] font-semibold text-emerald-600 uppercase">Present</div>
                      <div className="text-base font-bold text-gray-800 mt-0.5">{report.attendance?.present}</div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Fees */}
            <div className="card">
               <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-gray-800"><Wallet size={16} className="text-slate-500"/> Financial Summary</h3>
               <div className="space-y-2">
                 <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Total Fees</span>
                    <span className="font-mono font-semibold text-gray-800">₹{report.fees?.total.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-md border border-emerald-100">
                    <span className="text-sm font-medium text-emerald-700">Amount Paid</span>
                    <span className="font-mono font-semibold text-emerald-800">₹{report.fees?.paid.toLocaleString()}</span>
                 </div>
                 <div className={`flex justify-between items-center p-3 rounded-md border ${report.fees?.due > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                    <span className={`text-sm font-medium ${report.fees?.due > 0 ? "text-red-700" : "text-gray-500"}`}>Outstanding</span>
                    <span className={`font-mono font-bold ${report.fees?.due > 0 ? "text-red-700" : "text-gray-500"}`}>₹{report.fees?.due.toLocaleString()}</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Academic */}
          <div className="card">
            <div className="flex justify-between items-end mb-5 border-b border-gray-200 pb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-800"><FileText size={16} className="text-slate-500"/> Academic Performance</h3>
              <div className="text-right">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Overall Average</div>
                <div className="text-xl font-bold text-slate-700">{report.tests?.percentage}%</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Test Name</th>
                    <th className="py-2.5 px-2">Date</th>
                    <th className="py-2.5 px-2 text-right">Score</th>
                    <th className="py-2.5 px-2 text-right">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {Array.isArray(report.tests?.details) && report.tests.details.length > 0 ? report.tests.details.map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium text-gray-700">{t.test_name}</td>
                      <td className="py-3 px-2 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="py-3 px-2 text-right font-mono font-medium text-slate-700">{t.marks} / {t.total_marks} ({t.percentage}%)</td>
                      <td className="py-3 px-2 text-right font-semibold text-gray-400 text-base">#{t.rank}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="py-10 text-center text-gray-400 font-medium">No tests recorded in this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="hidden print:block mt-8 text-center text-xs font-medium text-gray-400">
             Official computer-generated record for {report.student?.name}
          </div>

        </div>
      )}
    </div>
  );
}
