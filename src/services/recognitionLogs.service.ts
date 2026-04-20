import { apiFetch } from "../api/apiClient";
import type { RecognitionLog } from "../types/recognitionLogs.types";

export const getRecognitionLogs = async (): Promise<RecognitionLog[]> => {
  try {
    const data = await apiFetch<any[]>("/recognition/logs");

    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const rawConfidence = item.confidence ?? 0;
      const confidence = Math.round(rawConfidence > 1 ? rawConfidence : rawConfidence * 100);

      const statusMap: Record<string, RecognitionLog["status"]> = {
        detected: "Accepted",
        success: "Accepted",
        processed: "Accepted",
        accepted: "Accepted",
        rejected: "Rejected",
        duplicate: "Duplicate",
      };
      const status = statusMap[item.status?.toLowerCase()] ?? "Rejected";

      return {
        id: String(item.id),
        timestamp: item.timestamp ? new Date(item.timestamp).toLocaleString() : "-",
        employeeId: item.employee_id || "UNKNOWN",
        name: item.employee_name || item.employee_id || "Unknown",
        camera: item.camera_type || "Entry",
        confidence,
        status,
        message: item.message || "-",
        imagePath: item.image_path || null,
      };
    });
  } catch (err) {
    console.error("Failed to fetch recognition logs:", err);
    return [];
  }
};