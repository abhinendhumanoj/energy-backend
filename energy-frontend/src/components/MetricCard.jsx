import { useEffect, useState } from "react";

export default function MetricCard({ title, value, unit }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1500;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        start = end;
      }
      setCount(parseFloat(start.toFixed(1)));
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="bg-[#041C32]/70 border border-cyan-700/30 p-5 rounded-2xl shadow-md hover:shadow-cyan-500/20 transition">
      <h3 className="text-gray-300 text-sm mb-2">{title}</h3>
      <p className="text-3xl font-bold text-cyan-300">
        {count} <span className="text-lg">{unit}</span>
      </p>
    </div>
  );
}
