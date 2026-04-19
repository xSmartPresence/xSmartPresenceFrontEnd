import { apiFetch } from "../api/apiClient";
import type { RecognitionLog } from "../types/recognitionLlogs.types";

export const getRecognitionLogs = async (): Promise<RecognitionLog[]> => {
  try {
    const res = await apiFetch<any>("/recognition-logs/");

    if (!res || !res.data) return [];

    return res.data.map((item: any) => ({
      id: String(item.id),
      timestamp: item.timestamp
        ? new Date(item.timestamp).toLocaleString()
        : "-",
      employeeId: item.employee_id || "UNKNOWN",
      name: item.employee_name || "Unknown",
      camera: item.camera_type || item.camera || "Entry",
      confidence: Math.round((item.confidence ?? 0) * 100),
      status:
        item.status === "accepted"
          ? "Accepted"
          : item.status === "rejected"
          ? "Rejected"
          : item.status === "duplicate"
          ? "Duplicate"
          : "Rejected",
    }));
  } catch (err) {
    console.error("Failed to fetch recognition logs:", err);
    return [];
  }
};