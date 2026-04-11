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
}

export interface AttendanceQueryParams {
  date: string;
  department?: string;
  search?: string;
}