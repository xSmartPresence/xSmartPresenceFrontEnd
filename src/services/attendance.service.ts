import { apiFetch } from "../api/apiClient";
import type {
  AttendanceRecord,
  AttendanceQueryParams,
} from "../types/attendance.types";

export const getAttendance = async (
  params: AttendanceQueryParams
): Promise<AttendanceRecord[]> => {
  const query = new URLSearchParams();

  query.append("date", params.date);

  if (params.department) {
    query.append("department", params.department);
  }

  if (params.search) {
    query.append("search", params.search);
  }

  const res = await apiFetch<any>(
    `/attendance/?${query.toString()}`
  );

  if (!res || !res.data) return [];

  return res.data.map((item: any) => ({
    code: item.employee_id,
    name: item.employee_name,
    department: item.department,
    date: item.punch_in || params.date,
    shift: "General",
    in: item.punch_in
      ? new Date(item.punch_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "-",
    out: item.punch_out
      ? new Date(item.punch_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "-",
    hours: "-",
    status: item.status,
    anomaly: "",
  }));
};