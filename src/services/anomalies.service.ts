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
}

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

const bool = (v: unknown, fallback = false): boolean =>
  typeof v === "boolean" ? v : fallback;

// Maps raw API response → frontend Anomaly shape
const mapAnomaly = (a: RawAnomaly): Anomaly => ({
  id:          a.id,
  title:       str(a.title)        || str(a.anomaly_type),
  severity:    (str(a.severity)    || "MEDIUM") as Anomaly["severity"],
  description: str(a.description)  || str(a.details),
  employee:    str(a.employee)     || str(a.employee_name) || "Unknown",
  time:        str(a.time)         || str(a.detected_at)   || str(a.created_at),
  resolved:    bool(a.resolved)    || bool(a.is_resolved),
  image:       typeof a.image === "string" ? a.image : undefined,
});

export const getAnomalies = async (): Promise<Anomaly[]> => {
  const raw = await apiFetch<RawAnomaly[]>("/anomalies/");
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