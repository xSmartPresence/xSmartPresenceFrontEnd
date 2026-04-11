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
