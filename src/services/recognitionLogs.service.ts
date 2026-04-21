import { apiFetch } from "../api/apiClient";
import type { RecognitionLog } from "../types/recognitionLogs.types";

interface RawLog {
  id?: unknown;
  timestamp?: unknown;
  employee_id?: unknown;
  employee_name?: unknown;
  camera_type?: unknown;
  confidence?: unknown;
  status?: unknown;
  message?: unknown;
  image_path?: unknown;
}

export const getRecognitionLogs = async (): Promise<RecognitionLog[]> => {
  try {
    const data = await apiFetch<RawLog[]>("/recognition/logs");

    if (!Array.isArray(data)) return [];

    return data.map((item: RawLog) => {
      const rawConfidence = typeof item.confidence === "number" ? item.confidence : 0;
      const confidence = Math.round(rawConfidence > 1 ? rawConfidence : rawConfidence * 100);

      const statusMap: Record<string, RecognitionLog["status"]> = {
        detected:  "Accepted",
        success:   "Accepted",
        processed: "Accepted",
        accepted:  "Accepted",
        rejected:  "Rejected",
        duplicate: "Duplicate",
      };

      const rawStatus = typeof item.status === "string" ? item.status.toLowerCase() : "";
      const status: RecognitionLog["status"] = statusMap[rawStatus] ?? "Rejected";

      return {
        id:         String(item.id ?? ""),
        timestamp:  item.timestamp
          ? new Date(String(item.timestamp)).toLocaleString()
          : "-",
        employeeId: typeof item.employee_id === "string" ? item.employee_id : "UNKNOWN",
        name:       typeof item.employee_name === "string"
          ? item.employee_name
          : typeof item.employee_id === "string"
            ? item.employee_id
            : "Unknown",
        camera:     typeof item.camera_type === "string" ? item.camera_type : "Entry",
        confidence,
        status,
        message:    typeof item.message    === "string" ? item.message    : "-",
        imagePath:  typeof item.image_path === "string" ? item.image_path : null,
      };
    });
  } catch (err) {
    console.error("Failed to fetch recognition logs:", err);
    return [];
  }
};