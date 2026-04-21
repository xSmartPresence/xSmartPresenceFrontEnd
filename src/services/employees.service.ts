import { apiFetch } from "../api/apiClient";
import type { Employee, CreateEmployeePayload, UpdateEmployeePayload } from "../types/employees.types";

interface RawEmployee {
  id?: unknown;
  employee_id?: unknown;
  code?: unknown;
  full_name?: unknown;
  name?: unknown;
  department_name?: unknown;
  department?: unknown;
  shift_name?: unknown;
  shift?: unknown;
  face_registered?: unknown;
  faceRegistered?: unknown;
  is_active?: unknown;
  active?: unknown;
}

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

const bool = (v: unknown, fallback = false): boolean =>
  typeof v === "boolean" ? v : fallback;

const numOrStr = (v: unknown): number | string =>
  typeof v === "number" || typeof v === "string" ? v : 0;

// Maps raw API response shape → frontend Employee shape
const mapEmployee = (e: RawEmployee): Employee => ({
  id:             numOrStr(e.id ?? e.employee_id) as number,
  code:           str(e.employee_id) || str(e.code),
  name:           str(e.full_name)   || str(e.name),
  department:     str(e.department_name) || str(e.department),
  shift:          str(e.shift_name)      || str(e.shift),
  faceRegistered: bool(e.face_registered) || bool(e.faceRegistered),
  active:         typeof e.is_active !== "undefined"
    ? bool(e.is_active)
    : bool(e.active, true),
});

export const getEmployees = async (): Promise<Employee[]> => {
  const raw = await apiFetch<RawEmployee[]>("/employees/");
  return raw.map(mapEmployee);
};

export const createEmployee = async (payload: CreateEmployeePayload): Promise<Employee> => {
  const raw = await apiFetch<RawEmployee>("/employees/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapEmployee(raw);
};

export const updateEmployee = async (code: string, payload: UpdateEmployeePayload): Promise<Employee> => {
  const raw = await apiFetch<RawEmployee>(`/employees/${code}`, {
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