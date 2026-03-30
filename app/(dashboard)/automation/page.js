"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Settings, Bell, CalendarCheck, Zap, Send } from "lucide-react";

export default function AutomationPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings).finally(() => setLoading(false));
  }, []);

  async function toggle(key) {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: updated[key] }),
    });
  }

  async function sendFeeReminder() {
    setSending(true);
    try {
      const res = await fetch("/api/fees");
      if (res.ok) {
        toast.success("Fee reminders sent!");
      } else {
        toast.error("Failed to send reminders");
      }
    } catch (error) {
      toast.error("Network error sending reminders");
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-9 w-56 animate-shimmer rounded-lg" />
        <div className="h-24 animate-shimmer rounded-lg" />
        <div className="h-24 animate-shimmer rounded-lg" />
        <div className="h-32 animate-shimmer rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-3">
          <Settings className="text-slate-600" size={22} />
          System Settings & Automation
        </h1>
        <p className="page-subtitle mt-1">Manage system resets and check the automation roadmap.</p>
      </div>

      <div className="space-y-4">
        {/* Factory Reset */}
        <div className="card border-red-100 bg-red-50/20">
          <div className="flex items-center gap-4 mb-5">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-md">
              <Zap size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Factory Reset</div>
              <div className="text-sm text-gray-500 mt-0.5">Completely wipe all data for this institute</div>
            </div>
          </div>
          <div className="pl-16">
            <button
              onClick={async () => {
                if (confirm("DANGER: This will PERMANENTLY DELETE all students, teachers, results, and records. This cannot be undone. Proceed?")) {
                  const id = toast.loading("Wiping all data...");
                  try {
                    const res = await fetch("/api/factory-reset", { method: "POST" });
                    const data = await res.json();
                    if (res.ok) {
                      toast.success("Factory Reset Successful", { id });
                      window.location.reload();
                    } else {
                      toast.error(data.error || "Reset failed", { id });
                    }
                  } catch (e) {
                    toast.error("Network error during reset", { id });
                  }
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md shadow-sm transition-colors flex items-center gap-2"
            >
              Full Factory Reset (Delete Everything)
            </button>
            <p className="text-[10px] text-red-400 mt-2 font-medium">⚠️ Warning: ALL records will be erased forever.</p>
          </div>
        </div>

        {/* Manual Seeding */}
        <div className="card">
          <div className="flex items-center gap-4 mb-5">
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-md">
              <CalendarCheck size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-800">System Demo Control</div>
              <div className="text-sm text-gray-500 mt-0.5">Pre-fill the system with 10 demo students for testing</div>
            </div>
          </div>
          <div className="pl-16">
            <button
              onClick={async () => {
                if (confirm("This will wipe existing data and add 10 demo students. Proceed?")) {
                  const id = toast.loading("Seeding demo data...");
                  try {
                    const res = await fetch("/api/seed", { method: "POST" });
                    const data = await res.json();
                    if (res.ok) {
                      toast.success("System Seeded Successfully", { id });
                      window.location.href = "/dashboard";
                    } else {
                      toast.error(data.error || "Seed failed", { id });
                    }
                  } catch (e) {
                    toast.error("Network error during reset", { id });
                  }
                }
              }}
              className="btn-primary"
            >
              Seed Demo Data (10 Students)
            </button>
          </div>
        </div>

        {/* Roadmap */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-slate-400" size={18} />
            <h3 className="font-bold text-slate-800">Future Automation Roadmap</h3>
          </div>
          <div className="space-y-3 opacity-60 pointer-events-none grayscale">
            <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-100">
               <span className="text-sm font-medium">WhatsApp Fee Reminders</span>
               <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">COMING SOON</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-100">
               <span className="text-sm font-medium">Automatic Attendance Alerts</span>
               <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">SOON</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-100">
               <span className="text-sm font-medium">AI Performance Analysis</span>
               <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">FUTURE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
