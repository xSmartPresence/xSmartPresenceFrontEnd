export interface Employee {
  id: number;
  code: string;
  name: string;
  department: string;   // display name shown on cards (mapped from API)
  shift: string;        // display name shown on cards (mapped from API)
  faceRegistered: boolean;
  active: boolean;
}

export interface CreateEmployeePayload {
  employee_id: string;
  full_name: string;
  department_id: number;  // integer ID sent to backend
  shift_id: number;       // integer ID sent to backend
  is_active: boolean;
}

// UpdateEmployeePayload is identical to CreateEmployeePayload — using a type
// alias instead of an empty interface avoids the @typescript-eslint/no-empty-object-type lint error.
export type UpdateEmployeePayload = CreateEmployeePayload;