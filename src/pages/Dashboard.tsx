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
  Wifi,
  WifiOff,
} from "lucide-react";

import { useEffect, useState, useRef } from "react";
import { getDashboardData, getSystemHealth } from "../services/dashboard.service";
import type { DashboardData } from "../types/dashboard.types";

const WS_URL = import.meta.env.VITE_WS_URL as string;
if (!WS_URL) throw new Error("VITE_WS_URL is not set in .env");

// Shape of the live summary pushed over WebSocket
interface LiveSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  earlyExit: number;
  overtime: number;
  occupancy: number;
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "offline">("connecting");
  const [liveSummary, setLiveSummary] = useState<LiveSummary | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 5;

  // ── Resize listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Initial API fetch ─────────────────────────────────────────────────────
useEffect(() => {
  const controller = new AbortController();

  getDashboardData(controller.signal)
    .then((res) => {
      if (!controller.signal.aborted) {
        setData(res);
        setLoading(false);
      }
    })
    .catch((err) => {
      if (err.name === "AbortError") return; // ignore cleanup aborts — not a real error
      console.error("Dashboard API Error:", err);
      setError("Failed to load dashboard data");
      setLoading(false);
    });

  return () => controller.abort(); // cancel fetch if component unmounts
}, []);

  // ── WebSocket connection with auto-reconnect ──────────────────────────────
  useEffect(() => {
  let mounted = true;
  retryCountRef.current = 0; // reset on every fresh mount

  const connect = () => {
    if (!mounted) return; // stop if unmounted
    if (retryCountRef.current >= MAX_RETRIES) {
      setWsStatus("offline");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setWsStatus("offline");
      return;
    }

    try {
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        retryCountRef.current = 0;
        setWsStatus("connected");
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as Record<string, unknown>;
          setLiveSummary({
            total:     (msg.total      ?? msg.total_employees  ?? 0) as number,
            present:   (msg.present    ?? msg.present_today    ?? 0) as number,
            absent:    (msg.absent     ?? msg.absent_today     ?? 0) as number,
            late:      (msg.late       ?? msg.late_arrivals    ?? 0) as number,
            earlyExit: (msg.earlyExit  ?? msg.early_exits      ?? 0) as number,
            overtime:  (msg.overtime   ?? msg.overtime_count   ?? 0) as number,
            occupancy: (msg.occupancy  ?? msg.office_occupancy ?? 0) as number,
          });
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        if (!mounted) return; // don't retry if unmounted
        retryCountRef.current += 1;

        if (retryCountRef.current >= MAX_RETRIES) {
          setWsStatus("offline");
          return;
        }

        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 30000);
        reconnectRef.current = setTimeout(connect, delay);
      };

    } catch (e) {
      if (!mounted) return;
      retryCountRef.current += 1;
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 30000);
        reconnectRef.current = setTimeout(connect, delay);
      } else {
        setWsStatus("offline");
      }
    }
  };

  connect();

  return () => {
    mounted = false; // mark unmounted
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    wsRef.current?.close();
    wsRef.current = null;
  };
}, []);

useEffect(() => {
  let mounted = true;

  const fetchHealth = async () => {
    try {
      const health = await getSystemHealth();
      if (!mounted) return;
      setData(prev => prev ? { ...prev, systemHealth: health } : prev);
    } catch (err) {
      console.warn("Health poll failed:", err);
    }
  };

  fetchHealth();
  const interval = setInterval(fetchHealth, 15_000);

  return () => {
    mounted = false;
    clearInterval(interval);
  };
}, []);

  // ── Loading / Error states ────────────────────────────────────────────────
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

  if (!data) return <div className="text-gray-400 text-sm p-4">Initialising...</div>;

  // ── Use live WebSocket data if available, else fall back to API data ──────
  const { attendanceData, deptData, systemHealth } = data;
  const summary = liveSummary ?? data.summary;

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
  const presentToday = liveSummary?.present ?? todayData.present;
  const absentToday  = liveSummary?.absent  ?? todayData.absent;

  const COLORS = ["#1bb451", "#b01212", "#f59e0b"];

  const fixedPieData = [
    { name: "Present", value: presentToday },
    { name: "Absent",  value: absentToday  },
    { name: "Late",    value: summary.late  },
  ].filter(item => item.value > 0);

  const pieInnerRadius = isMobile ? 40 : 55;
  const pieOuterRadius = isMobile ? 65 : 80;
  const pieHeight      = isMobile ? 200 : 260;
  const barHeight      = isMobile ? 200 : 260;
  const barSize        = isMobile ? 14  : 30;

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
       <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${
          wsStatus === "connected" ? "bg-green-100 text-green-700"
          : wsStatus === "offline"  ? "bg-red-100 text-red-500"
          : "bg-yellow-100 text-yellow-600"
       }`}>
          {wsStatus === "connected" ? <Wifi size={12} />
          : wsStatus === "offline"  ? <WifiOff size={12} />
          : <Wifi size={12} />} 
          {wsStatus === "connected" ? "Live"
          : wsStatus === "offline"  ? "Backend Offline"
          : "Connecting…"}
       </div>
      </div>
      <p className="text-gray-500 text-sm mb-2">Real-time attendance overview</p>

      {/* LIVE INDICATOR */}
      {liveSummary && (
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-600 font-medium">Live — updates every 10 seconds</span>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <Card title="Total Employees" value={liveSummary?.total ?? summary.total} color="#6366f1" icon={<Users size={16} />} live={!!liveSummary} />
        <Card title="Present Today" value={liveSummary?.present ?? presentToday} color="#22c55e" icon={<UserCheck size={16} />} live={!!liveSummary} />
        <Card title="Absent" value={liveSummary?.absent ?? absentToday} color="#ef4444" icon={<UserX size={16} />} live={!!liveSummary} />
        <Card title="Late Arrivals" value={liveSummary?.late ?? summary.late} color="#f59e0b" icon={<Clock size={16} />} live={!!liveSummary} />
        <Card title="Early Exit" value={liveSummary?.earlyExit ?? summary.earlyExit} color="#0ea5e9" icon={<Clock size={16} />} live={!!liveSummary} />
        <Card title="Overtime" value={liveSummary?.overtime ?? summary.overtime} color="#8b5cf6" icon={<Timer size={16} />} live={!!liveSummary} />
        <Card title="Office Occupancy" value={liveSummary?.occupancy ?? summary.occupancy} color="#14b8a6" icon={<Users size={16} />} live={!!liveSummary} />
      </div>

      {/* TREND + HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">

        {/* LINE CHART */}
        <Box className="lg:col-span-8">
          <h3 className="text-sm font-semibold mb-3">Attendance Trend (Weekly)</h3>
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
        </Box>

        {/* SYSTEM HEALTH */}
        <Box className="lg:col-span-4">
          <h3 className="text-sm font-semibold mb-3">System Health</h3>
          <HealthRow icon={<Radio size={18} />} label="Entry Camera"
            status={systemHealth.entryCamera}
            color={systemHealth.entryCamera === "Online" ? "#22c55e" : "#ef4444"} />
          <HealthRow icon={<Radio size={18} />} label="Exit Camera"
            status={systemHealth.exitCamera}
            color={systemHealth.exitCamera === "Online" ? "#22c55e" : "#ef4444"} />
          <HealthRow icon={<Radio size={18} />} label="AI Recognition"
            status={systemHealth.aiRecognition}
            color={systemHealth.aiRecognition === "Active" ? "#3b82f6" : "#64748b"} />
          <HealthRow icon={<Radio size={18} />} label="Last Sync"
            status={systemHealth.lastSync}
            color="#64748b" noBorder />
          <div className="mt-4 bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-gray-700">
            <BadgeCheck size={20} className={
              systemHealth.entryCamera === "Online" && systemHealth.exitCamera === "Online"
                ? "text-green-500" : "text-red-500"
            } />
            <span>
              {systemHealth.entryCamera === "Online" && systemHealth.exitCamera === "Online"
                ? "All systems operational"
                : "Some systems need attention"}
            </span>
          </div>
        </Box>
      </div>

      {/* PIE + BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* PIE */}
        <div className="bg-white rounded-xl shadow-sm w-full lg:col-span-6 px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold mb-1">Today's Distribution</h3>
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
          {fixedPieData.length === 0 && (
            <p className="text-center text-xs text-gray-400 mt-2 pb-4">No data for today</p>
          )}
        </div>

        {/* BAR */}
        <div className="bg-white rounded-xl shadow-sm w-full lg:col-span-6 px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold mb-6">Department-wise Attendance</h3>
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
              <Bar dataKey="absent"  fill="#ef4444" barSize={barSize} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

/* COMPONENTS */

interface CardProps {
  title: string;
  value: number | string;
  color: string;
  icon: React.ReactNode;
  live: boolean;
}

function Card({ title, value, color, icon, live }: CardProps) {
  return (
    <div className={`bg-white p-4 rounded-xl shadow-sm transition-all ${live ? "ring-1 ring-green-200" : ""}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span style={{ color }}>{icon}</span>
        <p className="truncate">{title}</p>
      </div>
      <h2 className="text-xl md:text-2xl font-bold mt-2 text-black">{value}</h2>
      {live && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 animate-pulse" />}
    </div>
  );
}

interface HealthRowProps {
  icon: React.ReactNode;
  label: string;
  status: string;
  color: string;
  noBorder?: boolean;
}

function HealthRow({ icon, label, status, color, noBorder }: HealthRowProps) {
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