"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, UserPlus, FileText, Calendar, Wallet, Bell, Target, TrendingUp, AlertTriangle, ArrowUpRight, ChevronRight, Activity } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="h-9 w-56 animate-shimmer rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-shimmer rounded-2xl" />)}
        </div>
        <div className="h-96 animate-shimmer rounded-2xl" />
      </div>
    );
  }

  const cardStyles = {
    "Total Students": { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-700", iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
    "Fees Collected": { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    "Pending Fees": { bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-700", iconBg: "bg-rose-100", iconColor: "text-rose-600" },
    "Present Today": { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
    "Absent Today": { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-700", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
    "My Batches": { bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-700", iconBg: "bg-violet-100", iconColor: "text-violet-600" },
    "My Students": { bg: "bg-indigo-50", border: "border-indigo-100", text: "text-indigo-700", iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
    "Days Present": { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
    "Total Classes": { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", iconBg: "bg-gray-100", iconColor: "text-gray-600" },
  };

  const cards = stats ? [
    stats.totalStudents !== undefined && { label: "Total Students", value: stats.totalStudents, icon: Users },
    stats.collectedFees !== undefined && { label: "Fees Collected", value: `₹${(stats.collectedFees || 0).toLocaleString()}`, icon: Wallet },
    stats.pendingFees !== undefined && { label: "Pending Fees", value: `₹${(stats.pendingFees || 0).toLocaleString()}`, icon: FileText },
    stats.presentToday !== undefined && { label: "Present Today", value: stats.presentToday || 0, icon: Calendar },
    stats.absentToday !== undefined && { label: "Absent Today", value: stats.absentToday || 0, icon: Users },
    stats.batchesCount !== undefined && { label: "My Batches", value: stats.batchesCount, icon: LayoutDashboard },
    stats.studentCount !== undefined && { label: "My Students", value: stats.studentCount, icon: Users },
    stats.presentCount !== undefined && { label: "Days Present", value: stats.presentCount, icon: Calendar },
    stats.totalAttendanceDays !== undefined && { label: "Total Classes", value: stats.totalAttendanceDays, icon: FileText },
  ].filter(Boolean) : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Business insights and operational status at a glance.</p>
        </div>
        {stats?.role === "ADMIN" && (
          <Link href="/reports" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl whitespace-nowrap hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md hover:shadow-indigo-200/50 flex items-center gap-2 text-sm">
            <FileText size={16} /> Generate Report
          </Link>
        )}
      </div>

      {/* ─── KPI CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          const style = cardStyles[c.label] || cardStyles["Total Classes"];
          return (
            <div key={idx} className={`stat-card ${style.bg} ${style.border} border`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className={`text-[11px] font-bold uppercase tracking-[0.12em] mb-2 ${style.text} opacity-70`}>{c.label}</div>
                  <div className={`text-3xl font-black tracking-tight ${style.text}`}>{c.value}</div>
                </div>
                <div className={`p-2.5 ${style.iconBg} rounded-xl`}>
                  <Icon size={20} className={style.iconColor} strokeWidth={2} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── ACTION REQUIRED ─── */}
      {insights && stats?.role === "ADMIN" && (insights.feeAlert || insights.attendanceAlert || insights.testAlert) && (
        <div className="bg-red-50/60 border border-red-200/60 rounded-2xl p-6">
           <h2 className="text-sm font-bold text-red-800 flex items-center gap-2 tracking-wide mb-4 uppercase">
             <AlertTriangle size={16} className="text-red-500"/> Action Required
           </h2>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {insights.feeAlert && (
               <div className="bg-white border border-red-100 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">Fee Defaulters Alert</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      ₹{insights.feeAlert.total_amount.toLocaleString()} pending from {insights.feeAlert.count} students. <br/>
                      <span className="text-red-600 font-semibold">Highest: {insights.feeAlert.top_name} (₹{insights.feeAlert.top_amount.toLocaleString()})</span>
                    </p>
                  </div>
                  <Link href="/fees" className="btn-primary bg-red-600 hover:bg-red-700 !shadow-none whitespace-nowrap text-xs">
                    <Bell size={14}/> Resolve Dues
                  </Link>
               </div>
             )}
             {insights.attendanceAlert && (
               <div className="bg-white border border-red-100 p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">Critical Attendance</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="text-red-600 font-semibold">{insights.attendanceAlert.count} students</span> dropped below 50% in the trailing week.
                    </p>
                  </div>
                  <Link href="/attendance-calendar" className="btn-primary bg-red-600 hover:bg-red-700 !shadow-none whitespace-nowrap text-xs">
                    <Calendar size={14}/> View Register
                  </Link>
               </div>
             )}
           </div>
        </div>
      )}

      {/* ─── GRAPHS ─── */}
      {graphs && stats?.role === "ADMIN" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Management Insights */}
          <div className="bg-white border border-gray-200/70 rounded-2xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col h-full relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-indigo-50 rounded-full blur-2xl opacity-50"></div>
            
            <h3 className="section-heading mb-6">
               <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                 <Activity size={14} />
               </span>
               Management Insights
            </h3>
            
            <div className="space-y-5 relative z-10 flex-1">
              {insights?.feeAlert ? (
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 p-2 bg-red-50 text-red-500 rounded-xl shrink-0">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-800">Revenue Risk Identified</p>
                    <p className="text-gray-500 mt-0.5 leading-relaxed">
                      <span className="text-red-600 font-semibold">{insights.feeAlert.top_name}</span> has ₹{insights.feeAlert.top_amount.toLocaleString()} outstanding.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 p-2 bg-emerald-50 text-emerald-500 rounded-xl shrink-0">
                    <Wallet size={16} />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-800">Healthy Cashflow</p>
                    <p className="text-gray-500 mt-0.5">Collections stable. No high-risk defaulters detected.</p>
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
                      <div className="flex items-start gap-3.5">
                        <div className="mt-0.5 p-2 bg-amber-50 text-amber-500 rounded-xl shrink-0">
                          <TrendingUp size={16} className="rotate-180" />
                        </div>
                        <div className="text-sm">
                          <p className="font-bold text-gray-800">Attendance Momentum Down</p>
                          <p className="text-gray-500 mt-0.5 leading-relaxed">
                            <span className="text-amber-600 font-semibold">{(previousAvg - recentAvg).toFixed(0)}% drop</span> detected vs previous window.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 p-2 bg-blue-50 text-blue-500 rounded-xl shrink-0">
                        <TrendingUp size={16} />
                      </div>
                      <div className="text-sm">
                        <p className="font-bold text-gray-800">Engagement Rising</p>
                        <p className="text-gray-500 mt-0.5">Attendance trending upwards vs last period.</p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 p-2 bg-gray-50 text-gray-400 rounded-xl shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-800">Attendance Tracking</p>
                    <p className="text-gray-500 mt-0.5">Collecting data for momentum analysis.</p>
                  </div>
                </div>
              )}
              
              {insights?.testAlert ? (
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 p-2 bg-indigo-50 text-indigo-500 rounded-xl shrink-0">
                    <Target size={16} />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-800">Academic Volatility</p>
                    <p className="text-gray-500 mt-0.5 leading-relaxed">
                      Score drop in <span className="text-indigo-600 font-semibold">{insights.testAlert[0].batch_name}</span> ({insights.testAlert[0].drop_percentage}%).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 p-2 bg-violet-50 text-violet-500 rounded-xl shrink-0">
                    <Target size={16} />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-gray-800">Academic Baseline Stable</p>
                    <p className="text-gray-500 mt-0.5">Scores consistent across all batches.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Chart */}
          <div className="card p-6">
            <h3 className="section-heading mb-6">
              <Users size={14} className="text-blue-500"/> Attendance Trend (30 Days)
            </h3>
            <div className="h-64 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphs.attendance}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                  <Tooltip cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '13px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="presentPct" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttendance)" activeDot={{ r: 5, fill: '#4f46e5', strokeWidth: 0, shadowBlur: 10, shadowColor: 'rgba(79, 70, 229, 0.5)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="card p-7 flex flex-col">
            <h3 className="section-heading mb-4">
              <Wallet size={14} className="text-amber-500"/> Fee Status Breakdown
            </h3>
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="h-[220px] w-full max-w-[220px] shrink-0 relative min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}>
                    <Tooltip 
                      contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '10px 14px', fontSize: '13px', fontWeight: 'bold' }} 
                      formatter={(value) => `₹${value.toLocaleString()}`} 
                    />
                    <Pie
                      data={graphs.feesObj}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                    >
                      {graphs.feesObj.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-90 transition-opacity" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3 justify-center">
                {graphs.feesObj.map((entry, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100 min-w-[150px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{entry.name}</span>
                    </div>
                    <div className="text-lg font-black text-gray-900 leading-none">
                      ₹{(entry.value || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Performance */}
          <div className="card p-6">
            <h3 className="section-heading mb-6">
              <Target size={14} className="text-violet-500"/> Test Performance (Averages)
            </h3>
            <div className="h-64 w-full relative min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphs.tests} maxBarSize={22}>
                  <defs>
                    <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#6d28d9" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tickMargin={12} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '13px', fontWeight: 'bold' }} />
                  <Bar dataKey="avgScore" fill="url(#colorTests)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
