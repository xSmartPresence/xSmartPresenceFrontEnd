export interface AttendanceRecord {
  code: string;
  name: string;
  department: string;
  date: string;
  shift: string;
  in: string;
  out: string;
  hours: string;
  status: string;
  anomaly?: string;
  late_minutes?: number;
  early_exit_minutes?: number;
  overtime_minutes?: number;
}

export interface AttendanceQueryParams {
  date: string;
  department?: string;
  search?: string;
}