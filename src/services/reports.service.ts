import { apiFetch } from "../api/apiClient";
import type { ReportRecord, ReportQueryParams } from "../types/reports.types";

interface RawReport {
  employee_id?: unknown;
  code?: unknown;
  full_name?: unknown;
  name?: unknown;
  department?: unknown;
  date?: unknown;
  status?: unknown;
  hours?: unknown;
  total_hours?: unknown;
}

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

// Maps raw API response → frontend ReportRecord shape
const mapReport = (r: RawReport): ReportRecord => ({
  code:       str(r.employee_id) || str(r.code),
  name:       str(r.full_name)   || str(r.name),
  department: str(r.department),
  date:       str(r.date),
  status:     str(r.status),
  hours:      typeof r.hours !== "undefined"
    ? String(r.hours)
    : typeof r.total_hours !== "undefined"
      ? String(r.total_hours)
      : "-",
});

export const getReports = async (params: ReportQueryParams): Promise<ReportRecord[]> => {
  const query = new URLSearchParams();

  query.append("type", params.type);

  if (params.department) query.append("department", params.department);
  if (params.date)       query.append("date", params.date);
  if (params.start_date) query.append("start_date", params.start_date);
  if (params.end_date)   query.append("end_date", params.end_date);

  const raw = await apiFetch<RawReport[] | { data: RawReport[] } | null>(
    `/reports/?${query.toString()}`
  );

  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(mapReport);
  if (typeof raw === "object" && "data" in raw && Array.isArray(raw.data)) {
    return raw.data.map(mapReport);
  }

  return [];
};