import { apiFetch } from "../api/apiClient";
import type { ReportRecord, ReportQueryParams } from "../types/reports.types";

// Maps raw API response → frontend ReportRecord shape
const mapReport = (r: any): ReportRecord => ({
  code:       r.employee_id  ?? r.code       ?? "",
  name:       r.full_name    ?? r.name        ?? "",
  department: r.department   ?? "",
  date:       r.date         ?? "",
  status:     r.status       ?? "",
  hours:      r.hours        ?? r.total_hours ?? "-",
});

export const getReports = async (params: ReportQueryParams): Promise<ReportRecord[]> => {
  const query = new URLSearchParams();

  query.append("type", params.type);

  if (params.department) query.append("department", params.department);
  if (params.date)       query.append("date", params.date);
  if (params.start_date) query.append("start_date", params.start_date);
  if (params.end_date)   query.append("end_date", params.end_date);

  const raw = await apiFetch<any>(`/reports/?${query.toString()}`);

  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(mapReport);
  if (Array.isArray(raw.data)) return raw.data.map(mapReport);

  return [];
};