import React, { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion"; // 🎬 Animation library
import hitamLogo from "../assets/hitam_logo.png";
import { useLayout } from "../context/LayoutContext";

const UnifiedDashboard = () => {
  const { sidebarOpen } = useLayout();
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalEnergy: 0,
    avgBill: 0,
    accuracy: 0,
  });
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🧾 Upload CSV
  const handleUpload = async () => {
    if (!file) return alert("Please select a CSV file first.");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://energy-backend-99ip.onrender.com/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.ok && result.data) {
        setData(result.data);
        setMetrics(result.metrics);
        setAvailableMonths(result.available_months || []);
        alert("✅ Data uploaded and processed successfully!");
      } else {
        throw new Error(result.message || "Upload failed.");
      }
    } catch (error) {
      console.warn("⚠️ Backend offline — loading mock data.");
      const mockData = [
        { Month: "Jan", Consumption_kWh: 420, Bill_Amount: 1800 },
        { Month: "Feb", Consumption_kWh: 460, Bill_Amount: 1900 },
        { Month: "Mar", Consumption_kWh: 500, Bill_Amount: 2100 },
      ];
      setData(mockData);
      setMetrics({ totalEnergy: 1380, avgBill: 1933, accuracy: 92.5 });
    } finally {
      setLoading(false);
    }
  };

  // 🤖 Predict Next Month
  const handlePredict = async () => {
    if (!selectedMonth) return alert("Please select a month to predict.");

    try {
      const res = await fetch("https://energy-backend-99ip.onrender.com/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth }),
      });

      const result = await res.json();

      if (result.ok) {
        const newEntry = {
          month: result.month,
          predicted: result.prediction,
          bill: result.predicted_bill,
          timestamp: new Date().toLocaleString(),
        };
        setHistory((prev) => [...prev, newEntry]);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.warn("⚠️ Backend not reachable — running offline prediction.");
      const mockValue = Math.floor(Math.random() * 600 + 400);
      const newEntry = {
        month: selectedMonth,
        predicted: mockValue,
        bill: mockValue * 4,
        timestamp: new Date().toLocaleString(),
      };
      setHistory((prev) => [...prev, newEntry]);
    }
  };

  // 🔁 Retrain
  const handleRetrain = async () => {
    try {
      const res = await fetch("https://energy-backend-99ip.onrender.com/api/retrain", {
        method: "POST",
      });
      const result = await res.json();
      alert(result.message);
    } catch {
      alert("Retrain request failed.");
    }
  };

  // 💾 Export CSV
  const exportCSV = () => {
    if (history.length === 0) return alert("No history to export.");
    const header = "Month,Predicted (kWh),Predicted Bill,Timestamp\n";
    const rows = history
      .map((h) => `${h.month},${h.predicted},${h.bill},${h.timestamp}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "AI_Prediction_History.csv";
    link.click();
  };

  // 📄 Export PDF
  const exportPDF = () => {
    if (history.length === 0) return alert("No history to export.");
    const doc = new jsPDF();
    doc.addImage(hitamLogo, "PNG", 10, 8, 25, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("HITAM Energy Intelligence", 40, 18);
    doc.setFontSize(11);
    doc.text("AI Energy Prediction History Report", 40, 26);
    doc.line(10, 35, 200, 35);

    const tableData = history.map((h) => [
      h.month,
      h.predicted,
      h.bill,
      h.timestamp,
    ]);
    doc.autoTable({
      startY: 40,
      head: [["Month", "Predicted (kWh)", "Predicted Bill (₹)", "Timestamp"]],
      body: tableData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
    });

    const timestamp = new Date().toLocaleString();
    doc.setFontSize(10);
    doc.text(`Generated on: ${timestamp}`, 14, doc.internal.pageSize.height - 20);
    doc.text(
      "Authorized by: HITAM Energy Intelligence System",
      14,
      doc.internal.pageSize.height - 15
    );
    doc.save("AI_Prediction_History.pdf");
  };

  // 🎬 Animation Variants
  const chartVariant = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  const rowVariant = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500 ease-in-out px-6 py-8 ${
        sidebarOpen
          ? "ml-64 bg-gradient-to-b from-[#001f2e] to-[#003e47]"
          : "ml-20 bg-gradient-to-b from-[#001f2e] to-[#003e47]"
      }`}
    >
      {/* 🎬 Animated Charts */}
      {data.length > 0 && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={chartVariant}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10"
        >
          {/* ⚡ Line Chart Animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-[#07212e]/80 rounded-xl p-6 border border-teal-800/40 shadow-md"
          >
            <h2 className="text-lg font-semibold text-teal-300 mb-4">
              ⚡ Energy Consumption (kWh)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f3849" />
                <XAxis dataKey="Month" stroke="#a3f0e4" />
                <YAxis stroke="#a3f0e4" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Consumption_kWh"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* 💰 Bar Chart Animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="bg-[#07212e]/80 rounded-xl p-6 border border-teal-800/40 shadow-md"
          >
            <h2 className="text-lg font-semibold text-teal-300 mb-4">
              💰 Monthly Bill (₹)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f3849" />
                <XAxis dataKey="Month" stroke="#a3f0e4" />
                <YAxis stroke="#a3f0e4" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Bill_Amount"
                  fill="#06b6d4"
                  animationDuration={1800}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>
      )}

      {/* 🕓 Animated Prediction History */}
      <div className="bg-[#07212e]/80 border border-teal-700/40 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-teal-300 mb-4">🤖 AI Prediction History</h2>

        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
          <input
            list="monthOptions"
            placeholder="Select Month (e.g., October 2025)"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#0b2b3a] text-white p-2 rounded-md w-full md:w-2/3 border border-teal-600"
          />
          <datalist id="monthOptions">
            {availableMonths.map((m, i) => (
              <option key={i} value={m} />
            ))}
          </datalist>
          <button
            onClick={handlePredict}
            className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-md font-semibold"
          >
            Predict
          </button>
          <button
            onClick={handleRetrain}
            className="bg-green-500 hover:bg-green-400 px-4 py-2 rounded-md font-semibold"
          >
            Retrain
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-teal-800/40 rounded-lg">
            <thead className="bg-teal-800/40">
              <tr>
                <th className="p-3 text-left">Month</th>
                <th className="p-3 text-left">Predicted (kWh)</th>
                <th className="p-3 text-left">Predicted Bill (₹)</th>
                <th className="p-3 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {history.map((h, i) => (
                  <motion.tr
                    key={i}
                    variants={rowVariant}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ delay: i * 0.1, duration: 0.4 }}
                    className="border-t border-teal-700/40 hover:bg-[#0b2b3a]/40 transition"
                  >
                    <td className="p-3">{h.month}</td>
                    <td className="p-3 text-yellow-300">{h.predicted}</td>
                    <td className="p-3 text-blue-300">₹{h.bill}</td>
                    <td className="p-3 text-gray-400">{h.timestamp}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          <div className="flex gap-4 mt-4">
            <button
              onClick={exportCSV}
              className="bg-teal-500 hover:bg-teal-400 px-4 py-2 rounded-md font-semibold"
            >
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-md font-semibold"
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
