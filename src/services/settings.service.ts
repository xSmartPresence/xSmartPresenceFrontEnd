import { apiFetch } from "../api/apiClient";
import type {
  SystemSettings,
  Holiday,
  AdminUser,
  CreateHolidayPayload,
  CreateAdminPayload,
  UpdateAdminPayload,
  UpdateSystemSettingsPayload,
} from "../types/settings.types";

const mapSettings = (s: any): SystemSettings => ({
  confidenceThreshold: Math.round((s.confidence_threshold ?? 0.80) * 100), // 0.80 → 80
  duplicateWindow:     s.duplicate_window_seconds ?? 30,
  gracePeriod:         s.grace_minutes ?? 15,
  overtimeAfter:       s.working_hours ?? 9,
});

const mapHoliday = (h: any): Holiday => ({
  id: h.id,
  name: h.name,
  date: h.holiday_date,   // ✅ FIXED
  type: h.type,
  description: h.day,     // optional (or remove if not needed)
});

const mapAdminUser = (u: any): AdminUser => ({
  id: u.id ?? u.user_id ?? u._id ?? null,   // ✅ handle all cases
  name: u.username ?? u.name ?? u.full_name ?? "",
  email: u.email,
  role: u.role,
  status: u.is_active ? "Active" : "Inactive",
});

// SYSTEM
export const getSystemSettings = async (): Promise<SystemSettings> => {
  const raw = await apiFetch<any>("/settings/");
  return mapSettings(raw);
};

export const updateSystemSettings = async (payload: UpdateSystemSettingsPayload) => {
  const raw = await apiFetch<any>("/settings/", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapSettings(raw);
};

// HOLIDAYS
export const getHolidays = async (): Promise<Holiday[]> => {
  const raw = await apiFetch<any[]>("/holidays/");
  return raw.map(mapHoliday);
};

export const createHoliday = async (payload: CreateHolidayPayload) => {
  const raw = await apiFetch<any>("/holidays/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapHoliday(raw);
};

export const deleteHoliday = async (id: number) => {
  return apiFetch(`/holidays/${id}`, { method: "DELETE" });
};

// USERS
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const raw = await apiFetch<any[]>("/auth/users");
  if (!Array.isArray(raw)) return [];
  return raw.map(mapAdminUser);
};

export const createAdminUser = async (payload: CreateAdminPayload) => {
  const raw = await apiFetch<any>("/auth/create-user", {
    method: "POST",
    body: JSON.stringify({
      username: payload.name,              // ✅ must be username
      email: payload.email,
      password: payload.password,
      role: payload.role.toLowerCase(),    // ✅ must be lowercase
    }),
  });

  return mapAdminUser(raw);
};
export const updateAdminUser = async (
  id: number,
  payload: UpdateAdminPayload
): Promise<AdminUser> => {
  const body = {
    username: payload.name,                 // ✅ correct field
    email: payload.email,
    role: payload.role.toLowerCase(),       // ✅ lowercase
    is_active: payload.status === "Active", // ✅ boolean
  };


  const raw = await apiFetch<any>(`/auth/users/${id}`, {
    method: "PUT",   // ✅ MUST be PUT
    body: JSON.stringify(body),
  });

  return mapAdminUser(raw);
};

export const deleteAdminUser = async (id: number): Promise<void> => {
  return apiFetch<void>(`/auth/users/${id}`, {
    method: "DELETE",
  });
};