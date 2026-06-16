import { apiFetch } from "../api/apiClient";
import type { Anomaly } from "../types/anomalies.types";

// Raw API response shape — all fields optional/unknown until validated in mapper
interface RawAnomaly {
  id: number;
  title?: unknown;
  anomaly_type?: unknown;
  severity?: unknown;
  description?: unknown;
  details?: unknown;
  employee?: unknown;
  employee_name?: unknown;
  time?: unknown;
  detected_at?: unknown;
  created_at?: unknown;
  resolved?: unknown;
  is_resolved?: unknown;
  image?: unknown;
  camera?: unknown;
  confidence?: unknown;
  resolved_by?: unknown;
  resolved_at?: unknown;
  resolution_note?: unknown;
}

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

const bool = (v: unknown, fallback = false): boolean =>
  typeof v === "boolean" ? v : fallback;

// Maps raw API response → frontend Anomaly shape
const mapAnomaly = (a: RawAnomaly): Anomaly => ({
  id:              a.id,
  title:           str(a.title)        || str(a.anomaly_type),
  anomaly_type: (str(a.anomaly_type) || str(a.title)).toUpperCase() || undefined,
  severity:        (str(a.severity)    || "MEDIUM") as Anomaly["severity"],
  description:     str(a.description)  || str(a.details),
  employee:        str(a.employee)     || str(a.employee_name) || "Unknown",
  time:            str(a.time)         || str(a.detected_at)   || str(a.created_at),
  resolved:        bool(a.resolved)    || bool(a.is_resolved),
  image:           typeof a.image === "string" ? a.image : undefined,
  camera:          str(a.camera)       || undefined,
  confidence:      typeof a.confidence === "number" ? a.confidence : null,
  resolved_by:     str(a.resolved_by)  || null,
  resolved_at:     str(a.resolved_at)  || null,
  resolution_note: str(a.resolution_note) || null,
});
export const getAnomalies = async (): Promise<Anomaly[]> => {
  const raw = await apiFetch<RawAnomaly[]>("/anomalies/");
  if (!Array.isArray(raw)) return [];
  return raw.map(mapAnomaly);
};

export const resolveAnomaly = async (id: number, note?: string): Promise<void> => {
  return apiFetch<void>(`/anomalies/${id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ resolution_note: note || "" }),
  });
};

export const updateAnomaly = async (id: number, payload: Partial<Anomaly>): Promise<Anomaly> => {
  const raw = await apiFetch<RawAnomaly>(`/anomalies/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapAnomaly(raw);
};

export const deleteAnomaly = async (id: number): Promise<void> => {
  return apiFetch<void>(`/anomalies/${id}`, {
    method: "DELETE",
  });
};

export const correctAnomaly = async (
  id: number,
  payload: { correction_reason: string; correction_notes: string }
): Promise<void> => {
  return apiFetch<void>(`/anomalies/${id}/correct`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const markAttendanceFromAnomaly = async (
  id: number,
  payload: { employee_id: string }
): Promise<void> => {
  return apiFetch<void>(`/anomalies/${id}/mark-attendance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};