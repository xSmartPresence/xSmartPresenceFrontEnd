import { apiFetch } from "../api/apiClient";
import type { Anomaly } from "../types/anomalies.types";

// Maps raw API response → frontend Anomaly shape
const mapAnomaly = (a: any): Anomaly => ({
  id:          a.id,
  title:       a.title        ?? a.anomaly_type  ?? "",
  severity:    a.severity     ?? "MEDIUM",
  description: a.description  ?? a.details       ?? "",
  employee:    a.employee     ?? a.employee_name  ?? "Unknown",
  time:        a.time         ?? a.detected_at    ?? a.created_at ?? "",
  resolved:    a.resolved     ?? a.is_resolved    ?? false,
  image:       a.image        ?? null,             // ← add this
});

export const getAnomalies = async (): Promise<Anomaly[]> => {
  const raw = await apiFetch<any[]>("/anomalies/");
  if (!Array.isArray(raw)) return [];
  return raw.map(mapAnomaly);
};

export const resolveAnomaly = async (id: number): Promise<void> => {
  return apiFetch<void>(`/anomalies/${id}/resolve`, {
    method: "PUT",
    body: JSON.stringify({ resolved: true }),
  });
};

export const updateAnomaly = async (id: number, payload: Partial<Anomaly>): Promise<Anomaly> => {
  const raw = await apiFetch<any>(`/anomalies/${id}`, {
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