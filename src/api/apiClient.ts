import { API_BASE } from "../config/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    signal: controller.signal,
    ...options,
    headers: {
      "Content-Type": "application/json", 
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
  }).finally(() => clearTimeout(timeout));

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
    throw new Error("Session expired. Please log in again.");
  }

   if (res.status === 403) {
    throw new Error("Permission denied. You don't have access to this resource.");
  }

  if (res.status === 500) {
    throw new Error("Server error. Please try again later.");
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || errData?.message || `API request failed: ${res.status}`);
  }

  return res.json();
}