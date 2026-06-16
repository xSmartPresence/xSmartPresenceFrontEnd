import { apiFetch } from "../api/apiClient";

export interface CalendarDay {
  status: "Present" | "Absent" | "Late" | "EarlyExit" | "Overtime" | null;
  punch_in: string | null;
  punch_out: string | null;
  working_hours: number;
  overtime_minutes: number;
}

export interface CalendarData {
  month: string;
  total_days: number;
  data: Record<string, Record<string, CalendarDay>>;
}

export const getAttendanceCalendar = async (
  month: string,
  employeeId: string
): Promise<Record<string, CalendarDay>> => {
  const data = await apiFetch<CalendarData>(
    `/api/v1/attendance/calendar?month=${month}&employee_id=${employeeId}`
  );
  return data?.data?.[employeeId] ?? {};
};