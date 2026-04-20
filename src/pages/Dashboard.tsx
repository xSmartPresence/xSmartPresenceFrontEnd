import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

import { BadgeCheck } from "lucide-react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Radio,
  Timer,
} from "lucide-react";

import { useEffect, useState } from "react";
import { getDashboardData } from "../services/dashboard.service";
import type { DashboardData } from "../types/dashboard.types";

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setMounted(true);
    getDashboardData()
      .then((res) => {
        console.log("Dashboard API:", res);
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard API Error:", err);
        setError("Failed to load dashboard data");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (error) return (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <p className="text-red-500">{error}</p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-[#0B1E3F] text-white text-sm rounded-lg hover:opacity-90"
    >
      Retry
    </button>
  </div>
  );
  if (!data) return null;

  const { summary, attendanceData, deptData, systemHealth } = data;

  const fullWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const filledData = fullWeek.map((day) => {
    const found = attendanceData.find((d) => d.day === day);
    return found || { day, present: 0, absent: 0 };
  });

 const allValues = filledData.flatMap(d => [d.present ?? 0, d.absent ?? 0]);
 const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;

  let yAxisGap = 10;
  if (maxValue <= 10) yAxisGap = 2;
  else if (maxValue <= 50) yAxisGap = 10;
  else if (maxValue <= 100) yAxisGap = 20;
  else if (maxValue <= 300) yAxisGap = 60;
  else yAxisGap = 100;

  const yAxisMax = Math.max(Math.ceil(maxValue / yAxisGap) * yAxisGap, 10);

  const barValues = (deptData ?? []).flatMap(d => [d.present ?? 0, d.absent ?? 0]);
  const barMax = barValues.length > 0 ? Math.max(...barValues) : 0;

  let barGap = 5;
  if (barMax <= 10) barGap = 2;
  else if (barMax <= 50) barGap = 10;
  else if (barMax <= 150) barGap = 30;
  else if (barMax <= 300) barGap = 60;
  else barGap = 100;

  const barYAxisMax = Math.max(Math.ceil(barMax / barGap) * barGap, 10);
  const safeBarGap = barYAxisMax > 0 ? barGap : 2;

  const today = new Date().toLocaleString("en-US", { weekday: "short" });
  const todayData = filledData.find(d => d.day === today) || { present: 0, absent: 0 };
  const presentToday = todayData.present;
  const absentToday = todayData.absent;

  const COLORS = ["#1bb451", "#b01212", "#f59e0b"];

  const fixedPieData = [
    { name: "Present", value: presentToday },
    { name: "Absent", value: absentToday },
    { name: "Late", value: summary.late },
  ].filter(item => item.value > 0);

  // ✅ Responsive chart dimensions
  const pieInnerRadius = isMobile ? 40 : 55;
  const pieOuterRadius = isMobile ? 65 : 80;
  const pieHeight = isMobile ? 200 : 260;
  const barHeight = isMobile ? 200 : 260;
  const barSize = isMobile ? 14 : 30;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Real-time attendance overview</p>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
        <Card title="Total Employees" value={summary.total} color="#6366f1" icon={<Users size={16} />} />
        <Card title="Present Today" value={presentToday} color="#22c55e" icon={<UserCheck size={16} />} />
        <Card title="Absent" value={absentToday} color="#ef4444" icon={<UserX size={16} />} />
        <Card title="Late Arrivals" value={summary.late} color="#f59e0b" icon={<Clock size={16} />} />
        <Card title="Early Exit" value={summary.earlyExit} color="#0ea5e9" icon={<Clock size={16} />} />
        <Card title="Overtime" value={summary.overtime} color="#8b5cf6" icon={<Timer size={16} />} />
        <Card title="Office Occupancy" value={summary.occupancy} color="#14b8a6" icon={<Users size={16} />} />
      </div>

      {/* TREND + HEALTH */}
     <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">

        {/* LINE CHART */}
        <Box className="lg:col-span-8">
          <h3 className="text-sm font-semibold mb-3">Attendance Trend (Weekly)</h3>
          {mounted && (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={filledData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={{ stroke: "#111827", strokeWidth: 1 }}
                  tickLine={{ stroke: "#111827", strokeWidth: 1 }}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, yAxisMax]}
                  ticks={Array.from({ length: yAxisMax / yAxisGap + 1 }, (_, i) => i * yAxisGap)}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={{ stroke: "#111827", strokeWidth: 1 }}
                  tickLine={{ stroke: "#111827", strokeWidth: 1 }}
                  allowDecimals={false}
                />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#fff", stroke: "#22c55e", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#fff", stroke: "#22c55e", strokeWidth: 2 }}
                />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#fff", stroke: "#ef4444", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#fff", stroke: "#ef4444", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* SYSTEM HEALTH */}
        <Box className="lg:col-span-4">
          <h3 className="text-sm font-semibold mb-3">System Health</h3>
          <HealthRow icon={<Radio size={18} />} label="Entry Camera" status={systemHealth.entryCamera}
            color={systemHealth.entryCamera === "Online" ? "#22c55e" : "#ef4444"} />
          <HealthRow icon={<Radio size={18} />} label="Exit Camera" status={systemHealth.exitCamera}
            color={systemHealth.exitCamera === "Online" ? "#22c55e" : "#ef4444"} />
          <HealthRow icon={<Radio size={18} />} label="AI Recognition" status={systemHealth.aiRecognition}
            color={systemHealth.aiRecognition === "Active" ? "#3b82f6" : "#64748b"} />
          <HealthRow icon={<Radio size={18} />} label="Last Sync" status={systemHealth.lastSync}
            color="#64748b" noBorder />
          <div className="mt-4 bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-gray-700">
            <BadgeCheck size={20} className="text-green-500" />
            <span>All systems operational</span>
          </div>
        </Box>
      </div>

      {/* PIE + BAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* PIE — ✅ no padding on wrapper, chart controls its own space */}
        <div className="bg-white rounded-xl shadow-sm w-full lg:col-span-6 px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold mb-1">Today's Distribution</h3>
          {mounted && (
            <ResponsiveContainer width="100%" height={pieHeight}>
              <PieChart>
                <Pie
                  data={fixedPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="42%"
                  innerRadius={pieInnerRadius}
                  outerRadius={pieOuterRadius}
                  paddingAngle={4}
                >
                  {fixedPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={40} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* BAR — ✅ no padding on wrapper, chart controls its own space */}
        <div className="bg-white rounded-xl shadow-sm w-full lg:col-span-6 px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold mb-1">Department-wise Attendance</h3>
          {mounted && (
            <ResponsiveContainer width="100%" height={barHeight}>
              <BarChart
                data={deptData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                barCategoryGap="20%"
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: isMobile ? 10 : 12, fill: "#6b7280" }}
                  axisLine={{ stroke: "#111827", strokeWidth: 1 }}
                  tickLine={{ stroke: "#111827", strokeWidth: 1 }}
                  interval={0}
                />
                <YAxis
                  domain={[0, barYAxisMax]}
                  ticks={Array.from({ length: Math.floor(barYAxisMax / safeBarGap) + 1 }, (_, i) => i * safeBarGap)}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={{ stroke: "#111827", strokeWidth: 1 }}
                  tickLine={{ stroke: "#111827", strokeWidth: 1 }}
                  allowDecimals={false}
                />
                <Tooltip />
                <Legend height={36} />
                <Bar dataKey="present" fill="#1e3a8a" barSize={barSize} radius={[6, 6, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" barSize={barSize} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}

/* COMPONENTS */

function Card({ title, value, color, icon }: any) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span style={{ color }}>{icon}</span>
        <p className="truncate">{title}</p>
      </div>
      <h2 className="text-xl md:text-2xl font-bold mt-2 text-black">{value}</h2>
    </div>
  );
}

function HealthRow({ icon, label, status, color, noBorder }: any) {
  return (
    <div className={`flex justify-between items-center py-3 ${noBorder ? "" : "border-b border-gray-200"}`}>
      <div className="flex items-center gap-3 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <span style={{ color }} className="px-3 py-1 rounded-full text-xs bg-gray-100">
        {status}
      </span>
    </div>
  );
}

interface BoxProps {
  children: React.ReactNode;
  className?: string;
}

const Box = ({ children, className = "" }: BoxProps) => (
  <div className={`bg-white p-4 md:p-6 rounded-xl shadow-sm w-full ${className}`}>
    {children}
  </div>
);

export default Dashboard;