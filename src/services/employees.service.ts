import { apiFetch } from "../api/apiClient";
import type { Employee, CreateEmployeePayload, UpdateEmployeePayload } from "../types/employees.types";

// Maps raw API response shape → frontend Employee shape
const mapEmployee = (e: any): Employee => ({
  id:             e.id ?? e.employee_id,
  code:           e.employee_id ?? e.code,
  name:           e.full_name   ?? e.name,
  department:     e.department_name ?? e.department ?? "",
  shift:          e.shift_name      ?? e.shift      ?? "",
  faceRegistered: e.face_registered ?? e.faceRegistered ?? false,
  active:         e.is_active       ?? e.active         ?? true,
});

export const getEmployees = async (): Promise<Employee[]> => {
  const raw = await apiFetch<any[]>("/employees/");
  return raw.map(mapEmployee);
};

export const createEmployee = async (payload: CreateEmployeePayload): Promise<Employee> => {
  const raw = await apiFetch<any>("/employees/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapEmployee(raw);
};

export const updateEmployee = async (code: string, payload: UpdateEmployeePayload): Promise<Employee> => {
  const raw = await apiFetch<any>(`/employees/${code}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapEmployee(raw);
};

export const deleteEmployee = async (code: string): Promise<void> => {
  return apiFetch<void>(`/employees/${code}`, {
    method: "DELETE",
  });
};

// FIX H4: Previously this was a raw fetch() call inside Employees.tsx that
// manually read the token from localStorage and had no 401/error handling.
// Moving it here through apiFetch means:
//   • Expired tokens are caught and redirect to login, exactly like every
//     other API call in the app.
//   • The Authorization header is assembled in one place (apiClient.ts).
//   • If the endpoint path ever changes it's updated alongside the other
//     employee endpoints, not buried inside a component.
export const enrollEmployee = async (employeeCode: string, photos: string[]): Promise<void> => {
  await apiFetch<unknown>(`/employees/${employeeCode}/enroll`, {
    method: "POST",
    body: JSON.stringify({ photos }),
  });
};