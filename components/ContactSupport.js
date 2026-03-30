"use client";

import { useState } from "react";
import { MessageCircle, X, Phone, Mail, Send } from "lucide-react";

export default function ContactSupport() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 ${
          open
            ? "bg-gray-800 text-white rotate-0"
            : "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
        }`}
        aria-label="Contact Support"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
            <h3 className="text-white font-bold text-base">Need Help?</h3>
            <p className="text-indigo-100 text-xs mt-0.5">We're here to support you 24/7</p>
          </div>

          {/* Options */}
          <div className="p-4 space-y-3">
            <a
              href="https://wa.me/919606000000?text=Hi%2C%20I%20need%20help%20with%20Alpha%20Coaching%20System"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 hover:border-emerald-200 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Send size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">WhatsApp Support</div>
                <div className="text-[11px] text-gray-500">Chat with us instantly</div>
              </div>
            </a>

            <a
              href="tel:+919606000000"
              className="flex items-center gap-3 p-3 rounded-xl bg-sky-50 border border-sky-100 hover:border-sky-200 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 group-hover:text-sky-700 transition-colors">Call Us</div>
                <div className="text-[11px] text-gray-500">+91 96060 00000</div>
              </div>
            </a>

            <a
              href="mailto:support@alphacoaching.in"
              className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-100 hover:border-violet-200 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-500 text-white flex items-center justify-center shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors">Email Us</div>
                <div className="text-[11px] text-gray-500">support@alphacoaching.in</div>
              </div>
            </a>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center font-medium">Alpha Coaching • Institute Management System</p>
          </div>
        </div>
      )}
    </>
  );
}
