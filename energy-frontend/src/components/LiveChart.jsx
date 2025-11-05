import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function LiveChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newPoint = {
          time: new Date().toLocaleTimeString().slice(3, 8),
          value: 100 + Math.random() * 50,
        };
        const updated = [...prev.slice(-19), newPoint]; // Keep last 20 points
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="time" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#041C32",
            border: "1px solid #0F4C75",
            borderRadius: "8px",
            color: "#E0F2FE",
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#22D3EE"
          strokeWidth={3}
          dot={false}
          animationDuration={500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
