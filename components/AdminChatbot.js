"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
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
    { sender: "bot", text: "Hello. How can I assist you with the Coaching Institute's data?" }
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
    // Convert our messages array to the format expected by the Groq API
    // Skip the initial greeting, take last 10 messages
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
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-5 zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white">
                <User size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Dashboard Assistant</h3>
                <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-semibold text-opacity-80">Connected Data Access</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-indigo-100 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === "user" ? "bg-slate-200 text-slate-600" : "bg-indigo-100 text-indigo-600"}`}>
                  {msg.sender === "user" ? <User size={14} /> : <User size={14} />}
                </div>
                <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.sender === "user" ? "bg-slate-800 text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"}`}>
                  <div className="prose prose-sm prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:text-slate-700 max-w-none dark:prose-invert">
                    <ReactMarkdown>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <User size={14} />
                </div>
                <div className="p-3 bg-white text-slate-500 rounded-2xl rounded-tl-none text-sm border border-slate-100 flex items-center gap-2 shadow-sm">
                  <Loader2 size={14} className="animate-spin text-indigo-600" /> Connecting to server...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="p-2 bg-white border-t border-slate-100">
            <div className="flex gap-2 overflow-x-auto pb-1 px-1 no-scrollbar items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap mr-1">Ask:</span>
              {FAQS.map(faq => (
                <button
                  key={faq.label}
                  onClick={() => handleFAQ(faq)}
                  disabled={loading}
                  className="whitespace-nowrap text-xs py-1.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full text-slate-700 font-bold transition-colors disabled:opacity-50 shadow-sm"
                >
                  {faq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input */}
          <form onSubmit={handleManualSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <input 
              type="text" 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={loading}
              placeholder="Ask anything about your data..." 
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={loading || !inputText.trim()}
              className="w-9 h-9 flex items-center justify-center shrink-0 bg-indigo-600 text-white rounded-full shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
