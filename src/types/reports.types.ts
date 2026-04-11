export interface ReportRecord {
  code: string;
  name: string;
  department: string;
  date: string;
  status: string;
  hours: number | string;
}

export interface ReportQueryParams {
  type: string;       // daily, weekly, monthly, late arrival, early exit, overtime
  department?: string;
  start_date?: string;
  end_date?: string;
  date?: string;
}