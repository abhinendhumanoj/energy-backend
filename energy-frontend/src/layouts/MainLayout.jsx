import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import AIAssistant from "../components/AIAssistant";
import { useLayout } from "../context/LayoutContext";

import {
  Menu,
  X,
  Brain,
  Calendar,
  Search,
  ChevronDown,
  FileDown,
  BarChart3,
  Lightbulb,
} from "lucide-react";

const MainLayout = ({ children }) => {
  const { sidebarOpen, setSidebarOpen } = useLayout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [username, setUsername] = useState("User");
  const [currentDate, setCurrentDate] = useState("");
  const [aiActive, setAiActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Initialize user info and animation
  useEffect(() => {
    const storedUser = localStorage.getItem("username") || "HITAM Analyst";
    setUsername(storedUser);

    const today = new Date();
    setCurrentDate(
      today.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );

    const interval = setInterval(() => {
      setAiActive((prev) => !prev);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Mock Search
  const mockData = [
    "Energy Consumption - September 2024",
    "Bill Report - July 2025",
    "AI Prediction - October 2025",
    "Insights Summary",
    "Monthly Comparison Report",
    "Training Data Overview",
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      setSuggestions(
        mockData.filter((item) =>
          item.toLowerCase().includes(query.toLowerCase())
        )
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item) => {
    setSearchQuery(item);
    setSuggestions([]);
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#001f2e] to-[#003e47] text-white overflow-hidden relative">
      {/* =======================
          ✅ Desktop Sidebar (Fixed)
      ======================= */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={!sidebarOpen} />
      </div>

      {/* =======================
          ✅ Mobile Sidebar (Slide-in)
      ======================= */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-[#041C32] transform transition-transform duration-300 ease-in-out md:hidden
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar isCollapsed={false} />
      </div>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =======================
          ✅ Main Content Area
      ======================= */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 overflow-hidden ${
          sidebarOpen ? "ml-64" : "ml-20"
        } md:ml-64`}
      >
        {/* ===== Header ===== */}
        <header className="flex flex-wrap items-center justify-between bg-[#06202b]/70 backdrop-blur-sm border-b border-teal-800/40 px-4 sm:px-6 py-4 shadow-md gap-3 sticky top-0 z-30">
          {/* Left side: Menu (Mobile) + Date */}
          <div className="flex items-center gap-3">
            {/* Mobile toggle button */}
            <button
              className="md:hidden text-teal-400 hover:text-white transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Date */}
            <div className="flex items-center gap-2 text-teal-300">
              <Calendar size={18} />
              <span className="text-sm sm:text-base">{currentDate}</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-[50%] md:w-[35%]">
            <div className="flex items-center bg-[#073241]/60 px-3 py-2 rounded-lg border border-teal-800/40 focus-within:border-teal-400 transition-all">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search insights, reports, or months..."
                className="w-full bg-transparent outline-none text-sm text-gray-200 placeholder-gray-500"
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute bg-[#05232e] border border-teal-700/40 rounded-md mt-2 w-full z-50 shadow-xl">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="px-4 py-2 hover:bg-teal-700/30 cursor-pointer text-gray-200 text-sm transition"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side: AI Indicator + Actions + User */}
          <div className="flex items-center gap-4 relative">
            {/* AI Status */}
            <div className="hidden sm:flex items-center gap-2 text-gray-300">
              <Brain
                size={18}
                className={`${
                  aiActive ? "text-green-400 drop-shadow-glow" : "text-gray-400"
                } transition-all`}
              />
              <span
                className={`${
                  aiActive ? "text-green-400" : "text-gray-400"
                } text-sm`}
              >
                {aiActive ? "AI Active" : "AI Idle"}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="flex items-center gap-1 bg-teal-600/40 hover:bg-teal-600/60 text-white px-3 py-2 rounded-md transition"
              >
                <Lightbulb size={16} />
                <span className="text-sm font-medium hidden sm:block">
                  Quick Actions
                </span>
                <ChevronDown size={14} />
              </button>

              {showActions && (
                <div className="absolute right-0 mt-2 bg-[#05232e] border border-teal-700/40 rounded-md w-56 shadow-lg z-50 animate-fade-in">
                  <button
                    onClick={() => {
                      setShowActions(false);
                      window.location.href = "/insights";
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-teal-700/30 text-gray-200 flex items-center gap-2"
                  >
                    <BarChart3 size={16} /> Jump to Insights
                  </button>

                  <button
                    onClick={() => {
                      setShowActions(false);
                      alert("🧾 Export triggered!");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-teal-700/30 text-gray-200 flex items-center gap-2"
                  >
                    <FileDown size={16} /> Export Current Report
                  </button>

                  <button
                    onClick={() => {
                      setShowActions(false);
                      window.location.href = "/history";
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-teal-700/30 text-gray-200 flex items-center gap-2"
                  >
                    📘 View Report History
                  </button>
                </div>
              )}
            </div>

            {/* User */}
            <div className="flex items-center gap-2 text-teal-300">
              <div className="w-8 h-8 bg-teal-500/40 rounded-full flex items-center justify-center font-semibold">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-sm sm:text-base hidden sm:block">
                {username}
              </span>
            </div>
          </div>
        </header>

        {/* ===== Scrollable Page Content ===== */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>

        {/* ===== AI Assistant ===== */}
        <AIAssistant />
      </div>
    </div>
  );
};

export default MainLayout;
