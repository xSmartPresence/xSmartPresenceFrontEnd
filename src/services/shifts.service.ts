import { apiFetch } from "../api/apiClient";
import type {
  Shift,
  Department,
  CreateShiftPayload,
  UpdateShiftPayload,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from "../types/shifts.types";

interface RawShift {
  id?: unknown;
  shift_name?: unknown;
  name?: unknown;
  start_time?: unknown;
  start?: unknown;
  end_time?: unknown;
  end?: unknown;
  grace_minutes?: unknown;
  grace?: unknown;
  overtime_minutes?: unknown;
}

interface RawDepartment {
  id?: unknown;
  name?: unknown;
  department_name?: unknown;
  head?: unknown;
  department_head?: unknown;
  employee_count?: unknown;
  employees?: unknown;
}

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : fallback;

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

// ── Mappers ───────────────────────────────────────────────────────────────
const mapShift = (s: RawShift): Shift => ({
  id:           num(s.id),
  name:         str(s.shift_name) || str(s.name),
  startTime:    str(s.start_time) || str(s.start),
  endTime:      str(s.end_time)   || str(s.end),
  graceMinutes: num(s.grace_minutes) || num(s.grace),
  overtimeRule: String(typeof s.overtime_minutes !== "undefined" ? s.overtime_minutes : ""),
});

const mapDepartment = (d: RawDepartment): Department => ({
  id:            num(d.id),
  name:          str(d.name)            || str(d.department_name),
  head:          str(d.head)            || str(d.department_head),
  employeeCount: num(d.employee_count)  || num(d.employees),
});

// ── Shift CRUD ────────────────────────────────────────────────────────────
export const getShifts = async (): Promise<Shift[]> => {
  const raw = await apiFetch<RawShift[]>("/shifts/");
  if (!Array.isArray(raw)) return [];
  return raw.map(mapShift);
};

export const createShift = async (payload: CreateShiftPayload): Promise<Shift> => {
  const raw = await apiFetch<RawShift>("/shifts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapShift(raw);
};

export const updateShift = async (id: number, payload: UpdateShiftPayload): Promise<Shift> => {
  const raw = await apiFetch<RawShift>(`/shifts/${id}`, {
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
  const raw = await apiFetch<RawDepartment[]>("/departments/");
  if (!Array.isArray(raw)) return [];
  return raw.map(mapDepartment);
};

export const createDepartment = async (payload: CreateDepartmentPayload): Promise<Department> => {
  const raw = await apiFetch<RawDepartment>("/departments/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapDepartment(raw);
};

export const updateDepartment = async (id: number, payload: UpdateDepartmentPayload): Promise<Department> => {
  const raw = await apiFetch<RawDepartment>(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapDepartment(raw);
};

export const deleteDepartment = async (id: number, deleteEmployees: boolean = false): Promise<void> => {
  return apiFetch<void>(`/departments/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ delete_employees: deleteEmployees }),
  });
};