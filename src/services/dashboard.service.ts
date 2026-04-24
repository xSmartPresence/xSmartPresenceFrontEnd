import { apiFetch } from "../api/apiClient";
import type { DashboardData, SystemHealth } from "../types/dashboard.types";

interface RawAttendanceItem {
  day?: unknown;
  date?: unknown;
  present?: unknown;
  absent?: unknown;
}

interface RawDeptItem {
  name?: unknown;
  department?: unknown;
  present?: unknown;
  absent?: unknown;
}

interface RawPieItem {
  name?: unknown;
  label?: unknown;
  value?: unknown;
  count?: unknown;
}

// Matches actual /health/dashboard response:
// { overall, database, ai_server, cameras: [{name, status, last_seen}], checked_at }
interface RawCameraItem {
  name?: string;
  status?: string;
  last_seen?: string;
}

interface RawSystemHealth {
  overall?: unknown;
  database?: unknown;
  ai_server?: unknown;
  cameras?: RawCameraItem[];
  checked_at?: unknown;
}

interface RawDashboard {
  total_employees?: unknown;
  present_today?: unknown;
  absent_today?: unknown;
  late_arrivals?: unknown;
  early_exits?: unknown;
  overtime_count?: unknown;
  office_occupancy?: unknown;
  summary?: {
    total?: unknown;
    present?: unknown;
    absent?: unknown;
    late?: unknown;
    earlyExit?: unknown;
    overtime?: unknown;
    occupancy?: unknown;
  };
  attendance_trend?: unknown;
  attendanceData?: unknown;
  distribution?: unknown;
  pieData?: unknown;
  department_stats?: unknown;
  deptData?: unknown;
}

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : fallback;

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

// ── Exported separately so Dashboard.tsx can poll it every 15s ──────────────
export const getSystemHealth = async (signal?: AbortSignal): Promise<SystemHealth> => {
  const health = await apiFetch<RawSystemHealth>("/health/dashboard", { signal });

  const cameras = health.cameras ?? [];
  const entry   = cameras.find(c => c.name === "Entry Camera");
  const exit    = cameras.find(c => c.name === "Exit Camera");

  return {
    entryCamera:   entry?.status              ?? "Unknown",
    exitCamera:    exit?.status               ?? "Unknown",
    aiRecognition: str(health.ai_server,        "Unknown"),
    lastSync:      str(health.checked_at,       "Unknown"),
  };
};

export const getDashboardData = async (signal?: AbortSignal): Promise<DashboardData> => {
  const raw = await apiFetch<RawDashboard>("/dashboard/", { signal });

  let systemHealth: SystemHealth = {
    entryCamera:   "Unknown",
    exitCamera:    "Unknown",
    aiRecognition: "Unknown",
    lastSync:      "Unknown",
  };

  try {
    systemHealth = await getSystemHealth(signal);
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    console.warn("System health fetch failed, using defaults:", err);
  }

  const rawAttendance = Array.isArray(raw.attendance_trend)
    ? (raw.attendance_trend as RawAttendanceItem[])
    : Array.isArray(raw.attendanceData)
      ? (raw.attendanceData as RawAttendanceItem[])
      : [];

  const rawPie = Array.isArray(raw.distribution)
    ? (raw.distribution as RawPieItem[])
    : Array.isArray(raw.pieData)
      ? (raw.pieData as RawPieItem[])
      : [];

  const rawDept = Array.isArray(raw.department_stats)
    ? (raw.department_stats as RawDeptItem[])
    : Array.isArray(raw.deptData)
      ? (raw.deptData as RawDeptItem[])
      : [];

  return {
    summary: {
      total:     num(raw.total_employees)  || num(raw.summary?.total),
      present:   num(raw.present_today)    || num(raw.summary?.present),
      absent:    num(raw.absent_today)     || num(raw.summary?.absent),
      late:      num(raw.late_arrivals)    || num(raw.summary?.late),
      earlyExit: num(raw.early_exits)      || num(raw.summary?.earlyExit),
      overtime:  num(raw.overtime_count)   || num(raw.summary?.overtime),
      occupancy: num(raw.office_occupancy) || num(raw.summary?.occupancy),
    },

    attendanceData: rawAttendance.map((item) => ({
      day:     str(item.day)   || str(item.date),
      present: num(item.present),
      absent:  num(item.absent),
    })),

    pieData: rawPie.map((item) => ({
      name:  str(item.name)  || str(item.label),
      value: num(item.value) || num(item.count),
    })),

    deptData: rawDept.map((item) => ({
      name:    str(item.name) || str(item.department),
      present: num(item.present),
      absent:  num(item.absent),
    })),

    systemHealth,
  };
};