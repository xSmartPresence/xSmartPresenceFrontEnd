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

// UpdateShiftPayload is identical to CreateShiftPayload — using a type alias
// instead of an empty interface avoids the @typescript-eslint/no-empty-object-type lint error.
export type UpdateShiftPayload = CreateShiftPayload;

export interface CreateDepartmentPayload {
  name: string;
  head: string;
  employee_count: number;
}

// Same rationale as UpdateShiftPayload above.
export type UpdateDepartmentPayload = CreateDepartmentPayload;