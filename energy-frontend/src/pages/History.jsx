import React, { useEffect, useState } from "react";
import { FileDown, Calendar, Trash2 } from "lucide-react";

const History = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("reportHistory")) || [];
    setReports(stored);
  }, []);

  const handleDownload = (report) => {
    const link = document.createElement("a");
    link.href = report.file;
    link.download = report.filename;
    link.click();
  };

  const handleDelete = (timestamp) => {
    const updated = reports.filter((r) => r.timestamp !== timestamp);
    setReports(updated);
    localStorage.setItem("reportHistory", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001f2e] to-[#003e47] text-white p-8">
      <h1 className="text-3xl font-bold text-teal-400 mb-6">
        📘 Historical AI Reports
      </h1>

      {reports.length === 0 ? (
        <div className="text-gray-400 text-center mt-20">
          No reports generated yet. <br />
          <span className="text-teal-400">Generate an Insights report first.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.timestamp}
              className="flex items-center justify-between bg-[#07212e] border border-teal-700/40 rounded-xl p-5 shadow-md hover:bg-[#09313f] transition-all"
            >
              <div>
                <h2 className="text-lg font-semibold text-teal-300">
                  {report.filename}
                </h2>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <Calendar size={14} className="text-gray-500" />
                  {new Date(report.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDownload(report)}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 px-4 py-2 rounded-md transition"
                >
                  <FileDown size={16} /> Download
                </button>
                <button
                  onClick={() => handleDelete(report.timestamp)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-3 py-2 rounded-md transition"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
