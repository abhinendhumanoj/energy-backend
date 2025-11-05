import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function LiveChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch uploaded CSV data from your backend
    fetch("https://energy-backend-99ip.onrender.com/api/data")  // ✅ change if your endpoint is different
      .then((res) => res.json())
      .then((data) => {
        setData(data); // The backend should return all month entries
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
        <XAxis dataKey="Month" stroke="#9CA3AF" />
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
          dataKey="Consumption_kWh"
          stroke="#22D3EE"
          strokeWidth={3}
          dot={true}
          animationDuration={500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

