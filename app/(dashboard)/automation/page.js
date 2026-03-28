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
          Automation Settings
        </h1>
        <p className="page-subtitle mt-1">Configure automated notifications and workflows.</p>
      </div>

      <div className="space-y-4">
        {/* Fee Reminders */}
        <div className="card flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-md">
              <Bell size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Fee Reminders</div>
              <div className="text-sm text-gray-500 mt-0.5">Auto-send fee due notifications via WhatsApp</div>
            </div>
          </div>
          <button
            onClick={() => toggle("feeReminders")}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${settings?.feeReminders ? "bg-slate-800" : "bg-gray-200"}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings?.feeReminders ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Attendance Alerts */}
        <div className="card flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-md">
              <CalendarCheck size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Attendance Alerts</div>
              <div className="text-sm text-gray-500 mt-0.5">Notify parents when student is marked absent</div>
            </div>
          </div>
          <button
            onClick={() => toggle("attendanceAlerts")}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0 ${settings?.attendanceAlerts ? "bg-slate-800" : "bg-gray-200"}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${settings?.attendanceAlerts ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Manual Actions */}
        <div className="card">
          <div className="flex items-center gap-4 mb-5">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-md">
              <Zap size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-800">Manual Actions</div>
              <div className="text-sm text-gray-500 mt-0.5">Trigger one-time actions manually</div>
            </div>
          </div>
          <div className="pl-16">
            <button
              onClick={sendFeeReminder}
              disabled={sending}
              className="btn-primary disabled:opacity-50"
            >
              <Send size={15} />
              {sending ? "Sending..." : "Send Fee Reminder Now"}
            </button>
          </div>
        </div>

        {/* System Control */}
        <div className="card border-red-100 bg-red-50/20">
          <div className="flex items-center gap-4 mb-5">
            <div className="p-2.5 bg-red-100 text-red-600 rounded-md">
              <Settings size={20} />
            </div>
            <div>
              <div className="font-semibold text-gray-800">System Control</div>
              <div className="text-sm text-gray-500 mt-0.5">Wipe and reset the database with sample data</div>
            </div>
          </div>
          <div className="pl-16">
            <button
              onClick={async () => {
                if (confirm("Are you SURE? This will DELETE all existing students, teachers, and records and reset to a clean state with 10 students.")) {
                  const id = toast.loading("Wiping and resetting system...");
                  try {
                    const res = await fetch("/api/seed", { method: "POST" });
                    const data = await res.json();
                    if (res.ok) {
                      toast.success(data.message, { id });
                      window.location.href = "/dashboard";
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
              <Zap size={14} />
              Factory Reset & Seed (10 Students)
            </button>
            <p className="text-[10px] text-red-400 mt-2 font-medium">⚠️ Warning: This action is irreversible.</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-5 flex items-start gap-4">
          <div className="p-2 bg-slate-200 text-slate-600 rounded-md flex-shrink-0 mt-0.5">
            <Zap size={14} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Automation Tip</h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Enable both fee reminders and attendance alerts for a fully automated parent communication system. Notifications are sent via WhatsApp through the n8n integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
