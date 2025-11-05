import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Bot } from "lucide-react";

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState([]);

  // 🧠 Load chat from localStorage on startup
  useEffect(() => {
    const savedChat = JSON.parse(localStorage.getItem("ai_chat_history")) || [];
    const savedMemory = JSON.parse(localStorage.getItem("ai_context_memory")) || [];
    if (savedChat.length > 0) {
      setMessages(savedChat);
      setMemory(savedMemory);
    } else {
      setMessages([
        { sender: "bot", text: "👋 Hi! I'm your HITAM AI Assistant. How can I help you analyze your energy data today?" },
      ]);
    }
  }, []);

  // 💾 Save chat history after each update
  useEffect(() => {
    localStorage.setItem("ai_chat_history", JSON.stringify(messages));
    localStorage.setItem("ai_context_memory", JSON.stringify(memory));
  }, [messages, memory]);

  // 📨 Send Message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/insights_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          context: memory,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        const botReply = { sender: "bot", text: data.reply };
        const newMessages = [...updatedMessages, botReply];
        setMessages(newMessages);
        setMemory(data.memory || []);
      } else {
        const fallback = { sender: "bot", text: "⚠️ Backend offline. Using saved mode." };
        setMessages((prev) => [...prev, fallback]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Cannot connect to server. Using offline mode." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 🧹 Clear chat history manually
  const clearChat = () => {
    localStorage.removeItem("ai_chat_history");
    localStorage.removeItem("ai_context_memory");
    setMessages([
      { sender: "bot", text: "🧠 Memory cleared! Let's start fresh. How can I help you today?" },
    ]);
    setMemory([]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        <div className="bg-[#07212e] w-80 h-96 rounded-2xl shadow-2xl flex flex-col border border-teal-700/40">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white p-3 rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold">HITAM AI Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} className="text-sm hover:text-yellow-300">🧹</button>
              <button onClick={() => setIsOpen(false)} className="text-white text-lg">×</button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 scroll-smooth">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] p-2 rounded-lg text-sm ${
                    msg.sender === "user"
                      ? "bg-teal-600/70 text-white rounded-br-none"
                      : "bg-[#0b2b3a] text-teal-200 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-teal-300 text-sm animate-pulse">
                <Bot size={14} /> Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-teal-700/40 p-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask AI anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#0b2b3a] text-gray-200 p-2 rounded-lg text-sm outline-none border border-teal-600/40 focus:border-teal-400"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-500 p-2 rounded-full text-white transition disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
