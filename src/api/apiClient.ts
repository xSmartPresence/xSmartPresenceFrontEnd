import { API_BASE } from "../config/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/";
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || errData?.message || `API request failed: ${res.status}`);
  }

  return res.json();
}