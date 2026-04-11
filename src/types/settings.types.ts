export interface SystemSettings {
  confidenceThreshold: number;
  duplicateWindow: number;
  gracePeriod: number;
  overtimeAfter: number;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;
  type: string;
  description: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface CreateHolidayPayload {
  name: string;
  holiday_date: string;  
  type: string;
}

export interface CreateAdminPayload {
  name: string;
  email: string;
  role: string;
  password: string;
}

export interface UpdateAdminPayload {
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface UpdateSystemSettingsPayload {
  confidence_threshold: number;
  duplicate_window_seconds: number;
  grace_minutes: number;
  working_hours: number;
  overtime_after_minutes: number;
}