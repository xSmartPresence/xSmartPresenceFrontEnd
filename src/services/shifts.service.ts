import { apiFetch } from "../api/apiClient";
import type {
  Shift,
  Department,
  CreateShiftPayload,
  UpdateShiftPayload,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from "../types/shifts.types";

// ── Mappers ───────────────────────────────────────────────────────────────
const mapShift = (s: any): Shift => ({
  id:           s.id,
  name:         s.shift_name  ?? s.name        ?? "",
  startTime:    s.start_time  ?? s.start        ?? "",
  endTime:      s.end_time    ?? s.end          ?? "",
  graceMinutes: s.grace_minutes ?? s.grace      ?? 0,
  overtimeRule: String(s.overtime_minutes ?? ""),
});

const mapDepartment = (d: any): Department => ({
  id:            d.id,
  name:          d.name            ?? d.department_name ?? "",
  head:          d.head            ?? d.department_head ?? "",
  employeeCount: d.employee_count  ?? d.employees       ?? 0,
});

// ── Shift CRUD ────────────────────────────────────────────────────────────
export const getShifts = async (): Promise<Shift[]> => {
  const raw = await apiFetch<any[]>("/shifts/");
  if (!Array.isArray(raw)) return [];
  return raw.map(mapShift);
};

export const createShift = async (payload: CreateShiftPayload): Promise<Shift> => {
  const raw = await apiFetch<any>("/shifts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapShift(raw);
};

export const updateShift = async (id: number, payload: UpdateShiftPayload): Promise<Shift> => {
  const raw = await apiFetch<any>(`/shifts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapShift(raw);
};

export const deleteShift = async (id: number): Promise<void> => {
  return apiFetch<void>(`/shifts/${id}`, {
    method: "DELETE",
  });
};

// ── Department CRUD ───────────────────────────────────────────────────────
export const getDepartments = async (): Promise<Department[]> => {
  const raw = await apiFetch<any[]>("/departments/");
  if (!Array.isArray(raw)) return [];
  return raw.map(mapDepartment);
};

export const createDepartment = async (payload: CreateDepartmentPayload): Promise<Department> => {
  const raw = await apiFetch<any>("/departments/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapDepartment(raw);
};

export const updateDepartment = async (id: number, payload: UpdateDepartmentPayload): Promise<Department> => {
  const raw = await apiFetch<any>(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapDepartment(raw);
};

export const deleteDepartment = async (id: number): Promise<void> => {
  return apiFetch<void>(`/departments/${id}`, {
    method: "DELETE",
  });
};