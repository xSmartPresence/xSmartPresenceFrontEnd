export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  overtimeRule: string;
}

export interface Department {
  id: number;
  name: string;
  head: string;
  employeeCount: number;
}

export interface CreateShiftPayload {
  shift_name: string;
  start_time: string;
  end_time: string;
  grace_minutes: number;
 overtime_minutes?: number;
}

export interface UpdateShiftPayload extends CreateShiftPayload {}

export interface CreateDepartmentPayload {
  name: string;
  head: string;
  employee_count: number;
}

export interface UpdateDepartmentPayload extends CreateDepartmentPayload {}