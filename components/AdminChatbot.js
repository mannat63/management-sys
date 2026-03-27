"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

const FAQS = [
  { label: "Best Batch?" },
  { label: "Fee Defaulters?" },
  { label: "Revenue Stats" },
  { label: "Absentee Stats" }
];

export default function AdminChatbot({ role }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I'm your dashboard assistant. Ask me anything about your institute's data." }
  ]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // Only render for ADMIN
  if (role !== "ADMIN") return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Build conversation history for the API
  function buildHistory() {
    return messages.slice(1).slice(-10).map(m => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text
    }));
  }

  async function sendToAI(userText) {
    setMessages(prev => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    try {
      const history = buildHistory();
      const res = await fetch("/api/chatbot/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { sender: "bot", text: data.answer || "Sorry, I couldn't compute that." }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: "bot", text: "Oops, network error." }]);
    }

    setLoading(false);
  }

  function handleFAQ(faq) {
    sendToAI(faq.label);
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!inputText.trim()) return;
    const queryText = inputText;
    setInputText("");
    sendToAI(queryText);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center group"
        >
          <Sparkles size={22} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[520px] bg-white rounded-2xl shadow-2xl shadow-gray-200/60 flex flex-col overflow-hidden border border-gray-200" style={{ animation: 'slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center text-white backdrop-blur-sm">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Assistant</h3>
                <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-semibold">Connected • Live Data</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 max-w-[88%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.sender === "user" ? "bg-gray-200 text-gray-600" : "bg-indigo-100 text-indigo-600"}`}>
                  {msg.sender === "user" ? <User size={13} /> : <Bot size={13} />}
                </div>
                <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-tr-md" : "bg-white text-gray-700 rounded-tl-md border border-gray-100 shadow-sm"}`}>
                  <div className="prose prose-sm prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:text-gray-700 max-w-none">
                    <ReactMarkdown>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 max-w-[88%]">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={13} />
                </div>
                <div className="px-3.5 py-2.5 bg-white text-gray-500 rounded-2xl rounded-tl-md text-[13px] border border-gray-100 flex items-center gap-2 shadow-sm">
                  <Loader2 size={14} className="animate-spin text-indigo-500" /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 bg-white border-t border-gray-100">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 px-0.5 no-scrollbar items-center">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap mr-1">Quick:</span>
              {FAQS.map(faq => (
                <button
                  key={faq.label}
                  onClick={() => handleFAQ(faq)}
                  disabled={loading}
                  className="whitespace-nowrap text-[11px] py-1.5 px-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-full text-gray-600 hover:text-indigo-600 font-semibold transition-all disabled:opacity-50"
                >
                  {faq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input */}
          <form onSubmit={handleManualSubmit} className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 items-center">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={loading}
              placeholder="Ask about your data..." 
              className="flex-1 text-[13px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400 transition-all disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={loading || !inputText.trim()}
              className="w-9 h-9 flex items-center justify-center shrink-0 bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
