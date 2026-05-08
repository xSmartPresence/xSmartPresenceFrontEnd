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

interface RawSettings {
  confidence_threshold?: unknown;
  duplicate_window_seconds?: unknown;
  grace_minutes?: unknown;
  working_hours?: unknown;
}

interface RawHoliday {
  id?: unknown;
  name?: unknown;
  holiday_date?: unknown;
  type?: unknown;
  day?: unknown;
}

interface RawAdminUser {
  id?: unknown;
  user_id?: unknown;
  _id?: unknown;
  username?: unknown;
  name?: unknown;
  full_name?: unknown;
  email?: unknown;
  role?: unknown;
  is_active?: unknown;
}

interface RawUpdateUserResponse {
  id?: unknown;
  user_id?: unknown;
  username?: unknown;
  name?: unknown;
  full_name?: unknown;
  email?: unknown;
  role?: unknown;
  is_active?: unknown;
  token?: string;
}

const num = (v: unknown, fallback = 0): number =>
  typeof v === "number" ? v : fallback;

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

const bool = (v: unknown, fallback = false): boolean =>
  typeof v === "boolean" ? v : fallback;

const mapSettings = (s: RawSettings): SystemSettings => ({
  confidenceThreshold: Math.round((num(s.confidence_threshold, 0.80)) * 100), // 0.80 → 80
  duplicateWindow:     num(s.duplicate_window_seconds, 30),
  gracePeriod:         num(s.grace_minutes, 15),
  overtimeAfter:       num(s.working_hours, 9),
});

const mapHoliday = (h: RawHoliday): Holiday => ({
  id:          num(h.id),
  name:        str(h.name),
  date:        str(h.holiday_date),   // API field → frontend field
  type:        str(h.type),
  description: str(h.day),           // optional day label
});

const mapAdminUser = (u: RawAdminUser): AdminUser => ({
  id:     num(u.id ?? u.user_id),    // handle all id variants
  name:   str(u.username) || str(u.name) || str(u.full_name),
  email:  str(u.email),
  role:   str(u.role),
  status: bool(u.is_active) ? "Active" : "Inactive",
});

// SYSTEM
export const getSystemSettings = async (): Promise<SystemSettings> => {
  const raw = await apiFetch<RawSettings>("/settings/");
  return mapSettings(raw);
};

export const updateSystemSettings = async (
  payload: UpdateSystemSettingsPayload
): Promise<SystemSettings> => {
  const raw = await apiFetch<RawSettings>("/settings/", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapSettings(raw);
};

// HOLIDAYS
export const getHolidays = async (): Promise<Holiday[]> => {
  const raw = await apiFetch<RawHoliday[]>("/holidays/");
  return raw.map(mapHoliday);
};

export const createHoliday = async (payload: CreateHolidayPayload): Promise<Holiday> => {
  const raw = await apiFetch<RawHoliday>("/holidays/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapHoliday(raw);
};

export const deleteHoliday = async (id: number): Promise<void> => {
  return apiFetch<void>(`/holidays/${id}`, { method: "DELETE" });
};

// USERS
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const raw = await apiFetch<RawAdminUser[]>("/auth/users");
  if (!Array.isArray(raw)) return [];
  return raw.map(mapAdminUser);
};

export const createAdminUser = async (payload: CreateAdminPayload): Promise<AdminUser> => {
  const raw = await apiFetch<RawAdminUser>("/auth/create-user", {
    method: "POST",
    body: JSON.stringify({
      username: payload.name,              // must be username
      email: payload.email,
      password: payload.password,
      role: payload.role.toLowerCase(),    // must be lowercase
    }),
  });
  return mapAdminUser(raw);
};

export const updateAdminUser = async (
  id: number,
  payload: UpdateAdminPayload
): Promise<{ user: AdminUser; token?: string }> => {
  const body = {
    username:  payload.name,
    email:     payload.email,
    role:      payload.role.toLowerCase(),
    is_active: payload.status === "Active",
  };

  const raw = await apiFetch<RawUpdateUserResponse>(`/auth/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return {
    user:  mapAdminUser(raw),
    token: raw.token,
  };
};

export const deleteAdminUser = async (id: number): Promise<void> => {
  return apiFetch<void>(`/auth/users/${id}`, {
    method: "DELETE",
  });
};