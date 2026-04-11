import { API_BASE } from "../config/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {

  const token = localStorage.getItem("token");
  console.log("TOKEN:", token);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
   headers: {
  "Content-Type": "application/json",
  ...(token && { Authorization: `Bearer ${token}` }), // ✅ only send if exists
  ...(options.headers || {}),
},
  });

  if (!res.ok) {
  const errData = await res.json().catch(() => null);
  throw new Error(errData?.detail || errData?.message || `API request failed: ${res.status}`);
}

  return res.json();
}