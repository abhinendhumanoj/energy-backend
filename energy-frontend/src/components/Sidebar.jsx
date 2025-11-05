import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import hitamLogo from "../assets/hitam_logo.png";

const Sidebar = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "Insights", path: "/insights", icon: "🧠" },
    { label: "History", path: "/history", icon: "📘" },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-[#041C32] text-white flex flex-col justify-between p-4 shadow-lg z-50
        ${isCollapsed ? "w-20" : "w-64"} transition-all duration-300`}
    >
      {/* Logo */}
      <div
        className={`flex flex-col items-center mb-6 transition-all duration-300 ${
          isCollapsed ? "mt-4" : "mt-2"
        }`}
      >
        <img
          src={hitamLogo}
          alt="HITAM Logo"
          className={`transition-all duration-300 ${
            isCollapsed ? "w-10 h-10" : "w-16 h-16"
          }`}
        />
        {!isCollapsed && (
          <h2 className="text-sm text-center mt-2 text-teal-400 font-semibold">
            HITAM Energy Intelligence
          </h2>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={`flex flex-col ${
          isCollapsed ? "items-center" : "w-full"
        } gap-3`}
      >
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-2 ${
              isCollapsed ? "justify-center px-3" : "px-4"
            } py-2 w-full rounded-md transition-all duration-200 ${
              location.pathname === item.path
                ? "bg-teal-600 text-white"
                : "bg-teal-600/30 hover:bg-teal-500/40"
            }`}
          >
            <span>{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={() => {
          localStorage.clear();
          navigate("/login");
        }}
        className={`bg-red-500/80 hover:bg-red-500 text-white py-2 rounded-md mt-6 w-full transition-all ${
          isCollapsed ? "text-sm" : ""
        }`}
      >
        {isCollapsed ? "⏻" : "Logout"}
      </button>
    </aside>
  );
};

export default Sidebar;
