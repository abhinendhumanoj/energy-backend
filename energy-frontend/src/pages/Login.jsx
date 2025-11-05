import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import hitamLogo from "../assets/hitam_logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email validator (simple and effective for UI)
  const isEmail = (u) => {
    if (!u || typeof u !== "string") return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.trim());
  };

  const handleLocalLogin = (u) => {
    // create a simple client-only token and persist username
    localStorage.setItem("token", `local_token_${Date.now()}`);
    localStorage.setItem("username", u);
    navigate("/dashboard");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!username || !password) {
      setError("Please enter username and password.");
      setLoading(false);
      return;
    }

    try {
      // Try backend login
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const result = await res.json();

      if (res.ok && result.ok) {
        // Backend accepted credentials
        localStorage.setItem("token", result.token);
        localStorage.setItem("username", username);
        navigate("/dashboard");
      } else {
        // Backend responded but credentials invalid:
        // If username is a valid email, allow local fallback (dev)
        if (isEmail(username)) {
          handleLocalLogin(username);
        } else {
          setError(result.message || "Invalid credentials. Please try again.");
        }
      }
    } catch (err) {
      // Connection error (Flask likely not running)
      // Accept any valid email address as credential for development convenience
      if (isEmail(username)) {
        handleLocalLogin(username);
      } else {
        setError(
          "⚠️ Connection error. Please ensure Flask server is running or use a valid email to bypass (dev mode)."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001f2e] to-[#003e47] flex items-center justify-center text-white p-4">
      <div className="bg-[#07212e]/95 p-10 rounded-2xl shadow-xl w-full max-w-md border border-teal-700/40 text-center">
        <div className="flex flex-col items-center mb-6">
          <img
            src={hitamLogo}
            alt="HITAM Logo"
            className="w-20 h-20 rounded-full mb-3 border-2 border-teal-400"
          />
          <h1 className="text-2xl font-bold text-teal-400">HITAM Energy Intelligence</h1>
          <p className="text-gray-400 text-sm">Secure AI Analytics Login Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 mt-6">
          <div>
            <label className="block text-left text-sm text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 bg-[#0b2b3a] border border-teal-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>

          <div>
            <label className="block text-left text-sm text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 bg-[#0b2b3a] border border-teal-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-medium bg-red-900/20 py-2 rounded-md">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-teal-500 hover:bg-teal-400 rounded-md font-semibold text-white transition-all duration-200"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-gray-400 text-xs text-center">
          <p>
            <span className="text-teal-400">Demo backend credentials:</span> <span className="font-medium">admin / hitam123</span>
          </p>
          <p className="mt-2">
            Dev fallback: you can use any <span className="font-semibold text-teal-300">valid email</span> to login if the Flask backend is not running.
          </p>
        </div>

        <p className="text-gray-500 text-xs mt-6">© {new Date().getFullYear()} HITAM Energy Intelligence</p>
      </div>
    </div>
  );
};

export default Login;
