"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, UserPlus, FileText, Calendar, Wallet, Bell, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b'];

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
      const [data, insData, graphData] = await Promise.all([
        fetch("/api/dashboard").then((r) => r.json()),
        fetch("/api/dashboard/insights").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/dashboard/graphs").then(r => r.ok ? r.json() : null).catch(() => null)
      ]);
      setStats(data);
      if (data?.role === "ADMIN" && insData && !insData.error) setInsights(insData);
      if (data?.role === "ADMIN" && graphData && !graphData.error) setGraphs(graphData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const cards = stats ? [
    stats.totalStudents !== undefined && { label: "Total Students", value: stats.totalStudents, className: "bg-indigo-50 border-indigo-100 text-indigo-700", icon: Users },
    stats.collectedFees !== undefined && { label: "Fees Collected", value: `₹${(stats.collectedFees || 0).toLocaleString()}`, className: "bg-emerald-50 border-emerald-100 text-emerald-700", icon: Wallet },
    stats.pendingFees !== undefined && { label: "Pending Fees", value: `₹${(stats.pendingFees || 0).toLocaleString()}`, className: "bg-rose-50 border-rose-100 text-rose-700", icon: FileText },
    stats.presentToday !== undefined && { label: "Present Today", value: stats.presentToday || 0, className: "bg-blue-50 border-blue-100 text-blue-700", icon: Calendar },
    stats.absentToday !== undefined && { label: "Absent Today", value: stats.absentToday || 0, className: "bg-orange-50 border-orange-100 text-orange-700", icon: Users },
    
    // Teacher specific
    stats.batchesCount !== undefined && { label: "My Batches", value: stats.batchesCount, className: "bg-purple-50 border-purple-100 text-purple-700", icon: LayoutDashboard },
    stats.studentCount !== undefined && { label: "My Students", value: stats.studentCount, className: "bg-indigo-50 border-indigo-100 text-indigo-700", icon: Users },

    // Student specific
    stats.presentCount !== undefined && { label: "Days Present", value: stats.presentCount, className: "bg-emerald-50 border-emerald-100 text-emerald-700", icon: Calendar },
    stats.totalAttendanceDays !== undefined && { label: "Total Classes", value: stats.totalAttendanceDays, className: "bg-slate-50 border-slate-200 text-slate-700", icon: FileText },
  ].filter(Boolean) : [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">Business insights and operational status.</p>
        </div>
        {stats?.role === "ADMIN" && (
          <Link href="/reports" className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl whitespace-nowrap hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center gap-2">
            <FileText size={18} /> Generate Action Report
          </Link>
        )}
      </div>

      {/* ─── A. KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm transition-transform hover:-translate-y-1 ${c.className}`}>
              <div className="flex items-center justify-between group">
                <div>
                  <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">{c.label}</div>
                  <div className="text-3xl font-black tracking-tight">{c.value}</div>
                </div>
                <div className="p-3 bg-white/50 rounded-xl backdrop-blur-sm">
                  <Icon size={24} className="opacity-80" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── C. ACTION REQUIRED ─── */}
      {insights && stats?.role === "ADMIN" && (insights.feeAlert || insights.attendanceAlert || insights.testAlert) && (
        <div className="bg-rose-50/50 border border-rose-200 rounded-3xl p-6 shadow-sm">
           <h2 className="text-lg font-black text-rose-900 flex items-center gap-2 tracking-tight mb-4 uppercase">
             <AlertTriangle size={20} className="text-rose-500"/> Action Required
           </h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {insights.feeAlert && (
               <div className="bg-white border border-rose-100 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Fee Defaulters Alert</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      ₹{insights.feeAlert.total_amount.toLocaleString()} pending from {insights.feeAlert.count} students. <br/>
                      <span className="text-rose-600 font-semibold">Highest Default: {insights.feeAlert.top_name} (₹{insights.feeAlert.top_amount.toLocaleString()})</span>
                    </p>
                  </div>
                  <Link href="/fees" className="btn-primary bg-rose-600 hover:bg-rose-700 whitespace-nowrap">
                    <Bell size={16}/> Resolve Dues
                  </Link>
               </div>
             )}
             
             {insights.attendanceAlert && (
               <div className="bg-white border border-rose-100 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Critical Attendance</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="text-rose-600 font-semibold">{insights.attendanceAlert.count} students</span> have dropped below 50% attendance in the trailing week.
                    </p>
                  </div>
                  <Link href="/attendance-calendar" className="btn-primary bg-rose-600 hover:bg-rose-700 whitespace-nowrap">
                    <Calendar size={16}/> Manage Register
                  </Link>
               </div>
             )}
           </div>
        </div>
      )}

      {/* ─── B. BASIC GRAPHS (RECHARTS) ─── */}
      {graphs && stats?.role === "ADMIN" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-7 shadow-sm transition-all hover:shadow-md relative overflow-hidden flex flex-col h-full group">
            {/* Background design accents */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-60"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-50 rounded-full blur-xl opacity-40"></div>
            
            <h3 className="text-[11px] font-black tracking-[0.2em] uppercase mb-6 flex items-center gap-2 text-indigo-500">
               <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:rotate-12 transition-transform duration-300">
                 <FileText size={14} />
               </span>
               Management Insights Engine
            </h3>
            
            <div className="space-y-6 relative z-10">
              {/* Insight 1: Revenue Risk */}
              {insights?.feeAlert ? (
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-rose-50 text-rose-500 rounded-xl shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="text-sm">
                    <p className="font-extrabold text-slate-800 tracking-tight">Revenue Risk Identified</p>
                    <p className="text-slate-500 mt-1 leading-relaxed">
                      <span className="text-rose-600 font-bold">{insights.feeAlert.top_name}</span> has an outstanding of <span className="font-bold text-slate-900">₹{insights.feeAlert.top_amount.toLocaleString()}</span>. Consider a direct follow-up today.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-emerald-50 text-emerald-500 rounded-xl shrink-0">
                    <Wallet size={18} />
                  </div>
                  <div className="text-sm">
                    <p className="font-extrabold text-slate-800 tracking-tight">Healthy Cashflow</p>
                    <p className="text-slate-500 mt-1">Collections are stable. No high-risk defaulters detected in the current cycle.</p>
                  </div>
                </div>
              )}
              
              {/* Insight 2: Attendance Momentum (Calculated) */}
              {graphs?.attendance?.length >= 10 ? (
                (() => {
                  const recent = graphs.attendance.slice(-3);
                  const previous = graphs.attendance.slice(-6, -3);
                  const recentAvg = recent.reduce((a, b) => a + b.presentPct, 0) / recent.length;
                  const previousAvg = previous.reduce((a, b) => a + b.presentPct, 0) / previous.length;
                  
                  if (recentAvg < previousAvg - 5) {
                    return (
                      <div className="flex items-start gap-4">
                        <div className="mt-1 p-2 bg-amber-50 text-amber-500 rounded-xl shrink-0">
                          <TrendingUp size={18} className="rotate-180" />
                        </div>
                        <div className="text-sm">
                          <p className="font-extrabold text-slate-800 tracking-tight">Attendance Momentum Down</p>
                          <p className="text-slate-500 mt-1 leading-relaxed">
                            A <span className="text-amber-600 font-bold">{(previousAvg - recentAvg).toFixed(0)}% drop</span> detected in attendance vs previous window. Suggest review of missing student list.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 bg-blue-50 text-blue-500 rounded-xl shrink-0">
                        <TrendingUp size={18} />
                      </div>
                      <div className="text-sm">
                        <p className="font-extrabold text-slate-800 tracking-tight">Waitlist Momentum Rising</p>
                        <p className="text-slate-500 mt-1">Engagement levels are trending upwards compared to the last period.</p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-slate-50 text-slate-400 rounded-xl shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="text-sm">
                    <p className="font-extrabold text-slate-800 tracking-tight">Attendance Tracking</p>
                    <p className="text-slate-500 mt-1">Collecting data points for historical momentum analysis.</p>
                  </div>
                </div>
              )}
              
              {/* Insight 3: Academic Performance */}
              {insights?.testAlert ? (
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-indigo-50 text-indigo-500 rounded-xl shrink-0">
                    <Target size={18} />
                  </div>
                  <div className="text-sm">
                    <p className="font-extrabold text-slate-800 tracking-tight">Academic Volatility</p>
                    <p className="text-slate-500 mt-1 leading-relaxed">
                      Significant score drop detected in <span className="text-indigo-700 font-bold">{insights.testAlert[0].batch_name}</span> ({insights.testAlert[0].drop_percentage}%). Review coverage.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-violet-50 text-violet-500 rounded-xl shrink-0">
                    <Target size={18} />
                  </div>
                  <div className="text-sm">
                    <p className="font-extrabold text-slate-800 tracking-tight">Academic Baseline Stable</p>
                    <p className="text-slate-500 mt-1 underline decoration-violet-200 underline-offset-4 decoration-2">Average scores are consistent across all batches.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card shadow-sm p-6 border-slate-200 ring-1 ring-slate-100">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Users size={16} className="text-blue-500"/> Attendance Trend (30 Days)
            </h3>
            <div className="h-64 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphs.attendance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                  <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="presentPct" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card shadow-sm p-7 border-slate-200 ring-1 ring-slate-100 flex flex-col">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Wallet size={16} className="text-amber-500"/> Fee Status Breakdown
            </h3>
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="h-[240px] w-full max-w-[240px] shrink-0 relative min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} 
                      formatter={(value) => `₹${value.toLocaleString()}`} 
                    />
                    <Pie
                      data={graphs.feesObj}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {graphs.feesObj.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-4 justify-center">
                {graphs.feesObj.map((entry, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 min-w-[160px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{entry.name}</span>
                    </div>
                    <div className="text-lg font-black text-slate-900 leading-none">
                      ₹{(entry.value || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card shadow-sm p-6 border-slate-200 ring-1 ring-slate-100">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Target size={16} className="text-indigo-500"/> Test Performance (Averages)
            </h3>
            <div className="h-64 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphs.tests} maxBarSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="avgScore" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}



    </div>
  );
}
