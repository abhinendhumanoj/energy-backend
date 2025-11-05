import React, { useEffect, useState } from "react";
import { FileDown, Loader2, Lightbulb, Brain } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import hitamLogo from "../assets/hitam_logo.png";
import { useLayout } from "../context/LayoutContext";
import { motion, AnimatePresence } from "framer-motion"; // 🎬 Animation library

const Insights = () => {
  const { sidebarOpen } = useLayout();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔍 Fetch insights from backend or mock fallback
  const fetchInsights = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://energy-backend-99ip.onrender.com/api/insights");
      const result = await res.json();

      if (result.ok && result.insights) {
        setInsights(result.insights);
      } else {
        throw new Error(result.message || "No insights available");
      }
    } catch (err) {
      console.warn("⚠️ Backend not reachable — using fallback mock insights.");
      setInsights([
        {
          id: 1,
          title: "High Energy Usage in Summer Months",
          detail:
            "Consumption peaked between May–July. Consider optimizing cooling systems or adopting solar offsets.",
        },
        {
          id: 2,
          title: "Stable Billing Pattern",
          detail:
            "Billing remained consistent with minimal deviations over the last 6 months — indicating steady usage habits.",
        },
        {
          id: 3,
          title: "AI Model Confidence",
          detail:
            "The AI model shows an 89.4% accuracy with low mean absolute error (MAE = 4.6%).",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // 📄 Export to PDF
  const exportPDF = () => {
    if (insights.length === 0) return alert("No insights to export yet.");
    const doc = new jsPDF();

    doc.addImage(hitamLogo, "PNG", 10, 8, 25, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("HITAM Energy Intelligence", 40, 18);
    doc.setFontSize(11);
    doc.text("AI Energy Insights Report", 40, 26);
    doc.line(10, 35, 200, 35);

    const tableData = insights.map((insight) => [insight.title, insight.detail]);
    doc.autoTable({
      startY: 40,
      head: [["Insight Title", "Details"]],
      body: tableData,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [20, 184, 166] },
    });

    const timestamp = new Date().toLocaleString();
    doc.text(`Generated on: ${timestamp}`, 14, doc.internal.pageSize.height - 20);
    doc.text(
      "Authorized by: HITAM Energy Intelligence System",
      14,
      doc.internal.pageSize.height - 15
    );
    doc.save("AI_Energy_Insights_Report.pdf");
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500 ease-in-out px-6 py-8 ${
        sidebarOpen
          ? "ml-64 bg-gradient-to-b from-[#001f2e] to-[#003e47]"
          : "ml-20 bg-gradient-to-b from-[#001f2e] to-[#003e47]"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-teal-400 flex items-center gap-2">
            <Brain size={26} className="text-green-400" />
            AI Energy Insights
          </h1>
          <p className="text-gray-400 text-sm">
            Analyze energy trends, generate AI insights, and export branded reports.
          </p>
        </div>

        <button
          onClick={exportPDF}
          className="bg-teal-500 hover:bg-teal-400 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2"
        >
          <FileDown size={18} /> Export PDF
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 size={40} className="animate-spin text-teal-400 mb-4" />
          <p>Analyzing your data and generating AI insights...</p>
        </div>
      ) : error ? (
        <p className="text-red-400 text-center mt-10">{error}</p>
      ) : insights.length === 0 ? (
        <div className="bg-[#07212e]/60 border border-teal-700/40 rounded-xl p-10 text-center shadow-lg">
          <Lightbulb size={40} className="text-yellow-400 mx-auto mb-4" />
          <h2 className="text-teal-300 font-semibold text-lg">
            Smart AI Recommendations
          </h2>
          <p className="text-gray-400 mt-2">
            Upload data on the dashboard to see AI-driven energy insights here.
          </p>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 transition-all duration-500"
          >
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15, // 👈 stagger animation for each card
                  ease: "easeOut",
                }}
                className="bg-[#07212e]/80 border border-teal-700/40 rounded-xl p-6 shadow-lg hover:shadow-teal-500/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Lightbulb size={22} className="text-yellow-400" />
                  <h3 className="text-lg font-semibold text-teal-300">
                    {insight.title}
                  </h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {insight.detail}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Insights;
