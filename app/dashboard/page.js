"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, UserPlus, FileText, Calendar, Wallet, Bell, Target, TrendingUp, AlertTriangle, ArrowUpRight, ChevronRight, Activity } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [graphs, setGraphs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const baseData = await fetch("/api/dashboard").then((r) => r.json()).catch(() => ({}));
      
      const fetchers = [
        fetch("/api/insights/attendance-risk").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/insights/fee-defaulters").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/insights/performance-risk").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/dashboard/graphs").then(r => r.ok ? r.json() : null).catch(() => null)
      ];

      // ONLY fetch global summary for Admin/Teacher
      if (baseData?.role === "ADMIN" || baseData?.role === "TEACHER") {
        fetchers.push(fetch("/api/dashboard/summary").then(r => r.ok ? r.json() : {}));
      }

      const [attRisk, feeRisk, perfRisk, graphData, summary] = await Promise.all(fetchers);

      setStats({ ...baseData, ...(summary || {}) });
      
      const mappedInsights = {};
      // ... (rest of logic remains same, but filtered by role in JSX)
      if (feeRisk?.success && feeRisk.count > 0) {
         mappedInsights.feeAlert = {
           count: feeRisk.count,
           data: feeRisk.data,
           total_amount: feeRisk.data.reduce((acc, curr) => acc + curr.pendingAmount, 0),
           top_name: feeRisk.data[0].name,
           top_amount: feeRisk.data[0].pendingAmount
         };
      }
      if (attRisk?.success && attRisk.count > 0) {
         mappedInsights.attendanceAlert = attRisk;
      }
      if (perfRisk?.success && perfRisk.count > 0) {
         mappedInsights.testAlert = [{
           batch_name: perfRisk.data[0].name + " & others underperforming",
           drop_percentage: perfRisk.data[0].avgMarks
         }];
      }
      if (baseData?.topPerformers) {
        mappedInsights.topPerformers = baseData.topPerformers;
      }
      setInsights(mappedInsights);

      if (baseData?.role === "ADMIN" && graphData && !graphData.error) setGraphs(graphData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-56 animate-shimmer rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-shimmer rounded-lg" />)}
        </div>
        <div className="h-80 animate-shimmer rounded-lg" />
      </div>
    );
  }

  const cardStyles = {
    "Total Students": { bg: "bg-white", border: "border-gray-200", text: "text-gray-900", label: "text-gray-500", iconBg: "bg-slate-100", iconColor: "text-slate-600" },
    "Fees Collected": { bg: "bg-white", border: "border-gray-200", text: "text-gray-900", label: "text-gray-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    "Unpaid Dues": { bg: "bg-white", border: "border-gray-200", text: "text-red-600", label: "text-gray-500", iconBg: "bg-red-50", iconColor: "text-red-500" },
    "Present Today": { bg: "bg-white", border: "border-gray-200", text: "text-gray-900", label: "text-gray-500", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    "Absent Today": { bg: "bg-white", border: "border-gray-200", text: "text-gray-900", label: "text-gray-500", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
    "My Batches": { bg: "bg-white", border: "border-gray-200", text: "text-gray-900", label: "text-gray-500", iconBg: "bg-slate-100", iconColor: "text-slate-600" },
    "My Students": { bg: "bg-white", border: "border-gray-200", text: "text-gray-900", label: "text-gray-500", iconBg: "bg-slate-100", iconColor: "text-slate-600" },
    "Days Present": { bg: "bg-white", border: "border-gray-200", text: "text-gray-900", label: "text-gray-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    "Total Classes": { bg: "bg-white", border: "border-gray-200", text: "text-gray-900", label: "text-gray-500", iconBg: "bg-gray-100", iconColor: "text-gray-600" },
  };

  const isAdmin = stats?.role === "ADMIN";
  const isTeacher = stats?.role === "TEACHER";
  const isStudent = stats?.role === "STUDENT";

  const cards = stats ? [
    // ADMIN ONLY stats
    isAdmin && stats.totalStudents !== undefined && { label: "Total Students", value: stats.totalStudents, icon: Users },
    isAdmin && stats.collectedFees !== undefined && { label: "Fees Collected", value: `₹${(stats.collectedFees || 0).toLocaleString()}`, icon: Wallet },
    isAdmin && stats.pendingFees !== undefined && { label: "Unpaid Dues", value: `₹${(stats.pendingFees || 0).toLocaleString()}`, icon: FileText },
    isAdmin && stats.presentToday !== undefined && { label: "Present Today", value: stats.presentToday || 0, icon: Calendar },
    isAdmin && stats.absentToday !== undefined && { label: "Absent Today", value: stats.absentToday || 0, icon: Users },

    // TEACHER ONLY stats
    isTeacher && stats.batchesCount !== undefined && { label: "My Batches", value: stats.batchesCount, icon: LayoutDashboard },
    isTeacher && stats.studentCount !== undefined && { label: "My Students", value: stats.studentCount, icon: Users },

    // STUDENT ONLY stats
    isStudent && stats.pendingFees !== undefined && { label: "Unpaid Dues", value: `₹${(stats.pendingFees || 0).toLocaleString()}`, icon: FileText },
    isStudent && stats.presentCount !== undefined && { label: "Days Present", value: stats.presentCount, icon: Calendar },
    isStudent && stats.totalAttendanceDays !== undefined && { label: "Total Classes", value: stats.totalAttendanceDays, icon: FileText },
  ].filter(Boolean) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Institutional metrics and operational status at a glance.</p>
        </div>
        {stats?.role === "ADMIN" && (
          <Link href="/reports" className="btn-primary whitespace-nowrap text-sm">
            <FileText size={15} /> Generate Report
          </Link>
        )}
      </div>

      {/* ─── KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          const style = cardStyles[c.label] || cardStyles["Total Classes"];
          return (
            <div key={idx} className={`stat-card ${style.bg} ${style.border} border`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${style.label}`}>{c.label}</div>
                  <div className={`text-2xl font-bold tracking-tight ${style.text}`}>{c.value}</div>
                </div>
                <div className={`p-2 ${style.iconBg} rounded-md`}>
                  <Icon size={18} className={style.iconColor} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── ACTION REQUIRED ─── */}
      {insights && stats?.role === "ADMIN" && (insights.feeAlert?.count > 0 || insights.attendanceAlert?.count > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
           <h2 className="text-sm font-semibold text-red-800 flex items-center gap-2 tracking-wide mb-4 uppercase">
             <AlertTriangle size={15} className="text-red-500"/> Action Required
           </h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
             {insights.feeAlert?.count > 0 && (
               <div className="bg-white border border-red-100 p-4 rounded-lg flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Overdue Fees Critical Risk ({insights.feeAlert.count})</h3>
                    <div className="mt-2 space-y-1">
                       {insights.feeAlert.data.slice(0, 3).map((student, i) => (
                         <div key={i} className="flex justify-between items-center text-xs">
                           <span className="font-medium text-gray-700">{student.name}</span>
                           <span className="text-red-600 font-bold">₹{student.pendingAmount.toLocaleString()}</span>
                         </div>
                       ))}
                       {insights.feeAlert.count > 3 && (
                         <div className="text-xs text-gray-500 italic">...and {insights.feeAlert.count - 3} more</div>
                       )}
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Link href="/students?risk=fees" className="btn-primary !bg-red-600 hover:!bg-red-700 whitespace-nowrap text-xs flex items-center gap-1.5 shadow-sm">
                      <ArrowUpRight size={13}/> View Students
                    </Link>
                  </div>
               </div>
             )}
             {insights.attendanceAlert?.count > 0 && (
               <div className="bg-white border border-red-100 p-4 rounded-lg flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Attendance Blacklist ({insights.attendanceAlert.count} &lt; 50%)</h3>
                    <div className="mt-2 space-y-1">
                       {insights.attendanceAlert.data.slice(0, 3).map((student, i) => (
                         <div key={i} className="flex justify-between items-center text-xs">
                           <span className="font-medium text-gray-700">{student.name}</span>
                           <span className="text-red-600 font-bold">{student.percentage}%</span>
                         </div>
                       ))}
                       {insights.attendanceAlert.count > 3 && (
                         <div className="text-xs text-gray-500 italic">...and {insights.attendanceAlert.count - 3} more</div>
                       )}
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Link href="/students?risk=attendance" className="btn-primary !bg-red-600 hover:!bg-red-700 whitespace-nowrap text-xs flex items-center gap-1.5 shadow-sm">
                      <ArrowUpRight size={13}/> View Students
                    </Link>
                  </div>
               </div>
             )}
           </div>
        </div>
      )}

      {/* ─── GRAPHS ─── */}
      {graphs && stats?.role === "ADMIN" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Management Insights */}
          <div className="card flex flex-col h-full">
            <h3 className="section-heading mb-5">
               <span className="p-1.5 bg-slate-100 text-slate-600 rounded-md">
                 <Activity size={13} />
               </span>
               Management Insights
            </h3>
            
            <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto pr-1">
              {insights?.feeAlert ? (
                <div className="p-3.5 border border-red-100 bg-red-50/40 rounded-lg flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-red-100 text-red-600 rounded-md shrink-0 shadow-sm">
                    <AlertTriangle size={14} />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">Revenue Risk</p>
                    <p className="text-gray-600 mt-0.5">
                      <span className="text-red-600 font-medium">{insights.feeAlert.top_name}</span> has ₹{insights.feeAlert.top_amount.toLocaleString()} outstanding.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 border border-emerald-100 bg-emerald-50/40 rounded-lg flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-emerald-100 text-emerald-700 rounded-md shrink-0 shadow-sm">
                    <Wallet size={14} />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">Healthy Cashflow</p>
                    <p className="text-gray-600 mt-0.5">Collections stable. No high-risk defaulters.</p>
                  </div>
                </div>
              )}
              
              {graphs?.attendance?.length >= 10 ? (
                (() => {
                  const recent = graphs.attendance.slice(-3);
                  const previous = graphs.attendance.slice(-6, -3);
                  const recentAvg = recent.reduce((a, b) => a + b.presentPct, 0) / recent.length;
                  const previousAvg = previous.reduce((a, b) => a + b.presentPct, 0) / previous.length;
                  
                  if (recentAvg < previousAvg - 5) {
                    return (
                      <div className="p-3.5 border border-amber-100 bg-amber-50/40 rounded-lg flex items-start gap-3">
                        <div className="mt-0.5 p-1.5 bg-amber-100 text-amber-700 rounded-md shrink-0 shadow-sm">
                          <TrendingUp size={14} className="rotate-180" />
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold text-gray-900">Attendance Drop</p>
                          <p className="text-gray-600 mt-0.5">
                            <span className="text-amber-700 font-medium">{(previousAvg - recentAvg).toFixed(0)}% drop</span> vs last window.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="p-3.5 border border-blue-100 bg-blue-50/40 rounded-lg flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 bg-blue-100 text-blue-700 rounded-md shrink-0 shadow-sm">
                        <TrendingUp size={14} />
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">Engagement Rising</p>
                        <p className="text-gray-600 mt-0.5">Attendance trending up successfully.</p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-3.5 border border-slate-200 bg-slate-50/50 rounded-lg flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-white border border-slate-200 text-slate-500 rounded-md shrink-0 shadow-sm">
                    <Calendar size={14} />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">Attendance Tracking</p>
                    <p className="text-gray-500 mt-0.5">Collecting data for trends.</p>
                  </div>
                </div>
              )}
              
              {insights?.testAlert ? (
                <div className="p-3.5 border border-slate-200 bg-white rounded-lg flex items-start gap-3 shadow-sm">
                  <div className="mt-0.5 p-1.5 bg-slate-100 text-slate-600 rounded-md shrink-0 border border-slate-200">
                    <Target size={14} />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">Academic Volatility</p>
                    <p className="text-gray-600 mt-0.5">
                      Drop in <span className="font-semibold text-slate-800">{insights.testAlert[0].batch_name}</span> ({insights.testAlert[0].drop_percentage}%).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 border border-slate-200 bg-white rounded-lg flex items-start gap-3 shadow-sm">
                  <div className="mt-0.5 p-1.5 bg-slate-100 text-slate-600 rounded-md shrink-0 border border-slate-200">
                    <Target size={14} />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">Academic Baseline Stable</p>
                    <p className="text-gray-500 mt-0.5">Scores consistent across batches.</p>
                  </div>
                </div>
              )}

              {/* 🏆 Top Performers Section */}
              {insights?.topPerformers && (
                <div className="p-4 bg-slate-900 text-white rounded-lg shadow-inner mt-2">
                   <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                      <TrendingUp size={16} className="text-emerald-400" />
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Top Performers / Batch</h4>
                   </div>
                   <div className="space-y-2.5">
                      {insights.topPerformers.map((tp, i) => (
                        <div key={i} className="flex justify-between items-center group">
                           <div className="min-w-0">
                              <p className="text-xs font-bold truncate group-hover:text-emerald-400 transition-colors">{tp.student_name}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-medium">{tp.batch_name}</p>
                           </div>
                           <div className="text-right shrink-0">
                              <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20">
                                 {tp.score}%
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Chart */}
          <div className="card p-5">
            <h3 className="section-heading mb-5">
              <Users size={13} className="text-slate-500"/> Attendance Trend (30 Days)
            </h3>
            <div className="h-60 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphs.attendance}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e293b" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} tick={{ fill: '#64748b' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} domain={[0, 100]} tick={{ fill: '#64748b' }} width={45} />
                  <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: '600', padding: '10px 14px' }} />
                  <Area type="monotone" dataKey="presentPct" stroke="#1e293b" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" dot={{ r: 3, fill: '#1e293b', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#1e293b', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="card p-5 flex flex-col">
            <h3 className="section-heading mb-4">
              <Wallet size={13} className="text-slate-500"/> Fee Status Breakdown
            </h3>
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="h-[200px] w-full max-w-[200px] shrink-0 relative min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '8px 12px', fontSize: '12px', fontWeight: '600' }} 
                      formatter={(value) => `₹${value.toLocaleString()}`} 
                    />
                    <Pie
                      data={graphs.feesObj}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={82}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {graphs.feesObj.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2.5 justify-center">
                {graphs.feesObj.map((entry, idx) => (
                  <div key={idx} className="p-2.5 rounded-md bg-gray-50 border border-gray-100 min-w-[140px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{entry.name}</span>
                    </div>
                    <div className="text-base font-bold text-gray-900 leading-none">
                      ₹{(entry.value || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Performance */}
          <div className="card p-5">
            <h3 className="section-heading mb-5">
              <Target size={13} className="text-slate-500"/> Test Performance (Averages)
            </h3>
            <div className="h-60 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphs.tests} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} width={100} tick={{ fill: '#64748b', fontWeight: 500 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: '600' }} />
                  <Bar dataKey="avgScore" fill="#334155" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
