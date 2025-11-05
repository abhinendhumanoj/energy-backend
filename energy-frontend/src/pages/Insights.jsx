import React, { useEffect, useState, useRef } from "react";
import {
  TrendingUp,
  Zap,
  AlertTriangle,
  Lightbulb,
  Gauge,
  FileDown,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import hitamLogo from "../assets/hitam_logo.png";

const Insights = () => {
  const [metrics, setMetrics] = useState({
    totalEnergy: 0,
    avgBill: 0,
    accuracy: 0,
  });
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const insightsRef = useRef();

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/data");
      const result = await res.json();

      if (result.ok && result.data.length > 0) {
        const data = result.data;
        setChartData(data);

        const maxEnergyMonth = data.reduce((a, b) =>
          a.Consumption_kWh > b.Consumption_kWh ? a : b
        );
        const maxBillMonth = data.reduce((a, b) =>
          a.Bill_Amount > b.Bill_Amount ? a : b
        );
        const avgEnergy = (
          data.reduce((a, b) => a + b.Consumption_kWh, 0) / data.length
        ).toFixed(2);

        const generatedInsights = [
          {
            title: "Peak Energy Consumption",
            value: `${maxEnergyMonth.Consumption_kWh} kWh`,
            detail: `Highest usage recorded in ${maxEnergyMonth.Month}`,
            icon: <Zap className="text-yellow-400" size={28} />,
            color: "bg-yellow-900/30 border-yellow-500/50",
            chartKey: "Consumption_kWh",
          },
          {
            title: "Highest Electricity Bill",
            value: `₹ ${maxBillMonth.Bill_Amount.toLocaleString()}`,
            detail: `Maximum bill generated in ${maxBillMonth.Month}`,
            icon: <TrendingUp className="text-green-400" size={28} />,
            color: "bg-green-900/30 border-green-500/50",
            chartKey: "Bill_Amount",
          },
          {
            title: "Average Consumption",
            value: `${avgEnergy} kWh`,
            detail: "Average monthly usage calculated from dataset",
            icon: <Gauge className="text-teal-400" size={28} />,
            color: "bg-teal-900/30 border-teal-500/50",
            chartKey: "Consumption_kWh",
          },
          {
            title: "AI Accuracy",
            value: `${result.metrics.accuracy}%`,
            detail: "Current model prediction accuracy",
            icon: <Lightbulb className="text-blue-400" size={28} />,
            color: "bg-blue-900/30 border-blue-500/50",
          },
        ];

        setMetrics(result.metrics);
        setInsights(generatedInsights);

        const recs = [];
        if (maxEnergyMonth.Consumption_kWh > avgEnergy * 1.2)
          recs.push(
            "Optimize heavy-load appliance usage during off-peak hours."
          );
        if (maxBillMonth.Bill_Amount > result.metrics.avgBill * 1.3)
          recs.push(
            "Electricity bill spikes detected — review usage and tariff slabs."
          );
        if (result.metrics.accuracy < 80)
          recs.push(
            "AI model accuracy is moderate — retraining may improve results."
          );
        if (recs.length === 0)
          recs.push("Energy usage and AI predictions look healthy!");

        setRecommendations(recs);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const generateComparison = () => {
    if (chartData.length < 2) return;
    const last = chartData[chartData.length - 1];
    const prev = chartData[chartData.length - 2];
    setComparison({
      currentMonth: last.Month,
      previousMonth: prev.Month,
      energyChange: last.Consumption_kWh - prev.Consumption_kWh,
      billChange: last.Bill_Amount - prev.Bill_Amount,
    });
  };

  const handleExportPDF = async () => {
    const input = insightsRef.current;
    const canvas = await html2canvas(input, { scale: 2, backgroundColor: "#001f2e" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(hitamLogo, "PNG", 15, 10, 25, 25);
    pdf.setFontSize(18);
    pdf.setTextColor(20, 180, 160);
    pdf.text("HITAM - AI Energy Intelligence", 45, 25);
    pdf.line(15, 32, 195, 32);
    pdf.addImage(imgData, "PNG", 0, 40, imgWidth, imgHeight);

    const timestamp = new Date().toLocaleString();
    pdf.setFontSize(10);
    pdf.text(`Report generated on: ${timestamp}`, 15, 285);
    pdf.text("Authorized by: HITAM Energy Intelligence System", 15, 291);

    pdf.save("HITAM_AI_Energy_Insights_Report.pdf");

    // Save to local history
    const reportEntry = {
      filename: "HITAM_AI_Energy_Insights_Report.pdf",
      timestamp: new Date().toISOString(),
      file: imgData,
    };
    const existing = JSON.parse(localStorage.getItem("reportHistory")) || [];
    existing.unshift(reportEntry);
    localStorage.setItem("reportHistory", JSON.stringify(existing));

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div ref={insightsRef} className="min-h-screen p-8 bg-gradient-to-b from-[#001f2e] to-[#003e47] text-white relative">
      {showToast && (
        <div className="fixed top-6 right-6 bg-green-600 text-white px-5 py-3 rounded-md flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 size={20} /> AI Report Generated Successfully!
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-teal-400 flex items-center gap-2">
          <Zap size={28} className="text-yellow-400" /> AI Energy Insights
        </h1>
        <div className="flex gap-3">
          <button
            onClick={generateComparison}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-md transition"
          >
            <BarChart3 size={18} /> Generate Comparison Report
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded-md transition"
          >
            <FileDown size={18} /> Export PDF
          </button>
        </div>
      </div>

      <p className="text-gray-300 mb-10 text-lg">
        Analyze energy trends, generate AI insights, and export branded reports.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`p-6 rounded-xl border shadow-md hover:scale-105 transition ${insight.color}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">{insight.title}</div>
              {insight.icon}
            </div>
            <div className="text-2xl font-bold text-teal-200 mb-2">
              {insight.value}
            </div>
            <p className="text-gray-400 text-sm mb-4">{insight.detail}</p>
            {insight.chartKey && (
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={chartData}>
                  <Tooltip contentStyle={{ backgroundColor: "#01232d", color: "white" }} />
                  <XAxis dataKey="Month" hide />
                  <YAxis hide />
                  <Line type="monotone" dataKey={insight.chartKey} stroke="#14b8a6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        ))}
      </div>

      {comparison && (
        <div className="bg-[#092d3a] border border-teal-700/40 rounded-xl p-6 mb-10">
          <h2 className="text-2xl font-semibold text-teal-300 flex items-center gap-2 mb-4">
            <BarChart3 size={26} className="text-blue-400" /> Month-over-Month Comparison
          </h2>
          <p className="text-gray-300 mb-2">
            {comparison.previousMonth} → {comparison.currentMonth}
          </p>
          <ul className="text-gray-200">
            <li>⚡ Energy Change: <span className="text-yellow-400">{comparison.energyChange} kWh</span></li>
            <li>💰 Bill Change: <span className="text-green-400">₹{comparison.billChange}</span></li>
          </ul>
        </div>
      )}

      <div className="bg-[#07212e]/80 border border-teal-700/40 rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-semibold text-teal-300 flex items-center gap-2 mb-4">
          <AlertTriangle size={26} className="text-yellow-400" /> Smart AI Recommendations
        </h2>
        <ul className="list-disc pl-6 space-y-3 text-gray-300">
          {recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Insights;
