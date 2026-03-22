"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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
      // Triggers webhook via the existing n8n service
      const res = await fetch("/api/fees"); // Just a trigger — in production this would call the webhook
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
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="h-24 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-24 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Automation Settings</h1>

      <div className="space-y-4 max-w-xl">
        {/* Fee Reminders Toggle */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-800">Fee Reminders</div>
            <div className="text-sm text-slate-500 mt-0.5">Auto-send fee due notifications via WhatsApp</div>
          </div>
          <button
            onClick={() => toggle("feeReminders")}
            className={`relative w-12 h-6 rounded-full transition-colors ${settings?.feeReminders ? "bg-teal-600" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings?.feeReminders ? "translate-x-6" : ""}`} />
          </button>
        </div>

        {/* Attendance Alerts Toggle */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-800">Attendance Alerts</div>
            <div className="text-sm text-slate-500 mt-0.5">Notify parents when student is marked absent</div>
          </div>
          <button
            onClick={() => toggle("attendanceAlerts")}
            className={`relative w-12 h-6 rounded-full transition-colors ${settings?.attendanceAlerts ? "bg-teal-600" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings?.attendanceAlerts ? "translate-x-6" : ""}`} />
          </button>
        </div>

        {/* Manual Trigger */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="font-semibold text-slate-800 mb-1">Manual Actions</div>
          <div className="text-sm text-slate-500 mb-4">Trigger one-time actions manually</div>
          <button
            onClick={sendFeeReminder}
            disabled={sending}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {sending ? "Sending..." : "📩 Send Fee Reminder Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
