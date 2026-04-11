import { apiFetch } from "../api/apiClient";
import type { DashboardData } from "../types/dashboard.types";

export const getDashboardData = async (): Promise<DashboardData> => {
  const raw = await apiFetch<any>("/dashboard/");

  // ✅ ADD THIS BLOCK
  let systemHealth = {
    entryCamera: "Unknown",
    exitCamera: "Unknown",
    aiRecognition: "Unknown",
    lastSync: "Unknown",
  };

  try {
    const health = await apiFetch<any>("/system/health");

    systemHealth = {
      entryCamera:   health.entry_camera   ?? "Unknown",
      exitCamera:    health.exit_camera    ?? "Unknown",
      aiRecognition: health.ai_recognition ?? "Unknown",
      lastSync:      health.last_sync      ?? "Unknown",
    };
  } catch {
    // keep defaults if API fails
  }

  return {
    summary: {
      total:     raw.total_employees   ?? raw.summary?.total     ?? 0,
      present:   raw.present_today     ?? raw.summary?.present   ?? 0,
      absent:    raw.absent_today      ?? raw.summary?.absent    ?? 0,
      late:      raw.late_arrivals     ?? raw.summary?.late      ?? 0,
      earlyExit: raw.early_exits       ?? raw.summary?.earlyExit ?? 0,
      overtime:  raw.overtime_count    ?? raw.summary?.overtime  ?? 0,
      occupancy: raw.office_occupancy  ?? raw.summary?.occupancy ?? 0,
    },

    attendanceData: Array.isArray(raw.attendance_trend ?? raw.attendanceData)
      ? (raw.attendance_trend ?? raw.attendanceData).map((item: any) => ({
          day:     item.day   ?? item.date ?? "",
          present: item.present ?? 0,
          absent:  item.absent  ?? 0,
        }))
      : [],

    pieData: Array.isArray(raw.distribution ?? raw.pieData)
      ? (raw.distribution ?? raw.pieData).map((item: any) => ({
          name:  item.name  ?? item.label ?? "",
          value: item.value ?? item.count ?? 0,
        }))
      : [],

    deptData: Array.isArray(raw.department_stats ?? raw.deptData)
      ? (raw.department_stats ?? raw.deptData).map((item: any) => ({
          name:    item.name       ?? item.department ?? "",
          present: item.present    ?? 0,
          absent:  item.absent     ?? 0,
        }))
      : [],

    systemHealth, // ✅ ADD THIS LINE
  };
};