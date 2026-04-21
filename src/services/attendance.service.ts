import { apiFetch } from "../api/apiClient";
import type {
  AttendanceRecord,
  AttendanceQueryParams,
} from "../types/attendance.types";

interface AttendanceItem {
  employee_id: string;
  employee_name: string;
  department: string;
  punch_in: string | null;
  punch_out: string | null;
  status: string;
}

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

  const res = await apiFetch<{ data: AttendanceItem[] }>(
    `/attendance/?${query.toString()}`
  );

  if (!res || !res.data) return [];

  return res.data.map((item: AttendanceItem) => ({
    code: item.employee_id,
    name: item.employee_name,
    department: item.department,
    date: item.punch_in || params.date,
    shift: "General",
    in: item.punch_in
      ? new Date(item.punch_in).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-",
    out: item.punch_out
      ? new Date(item.punch_out).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-",
    hours: "-",
    status: item.status,
    anomaly: "",
  }));
};