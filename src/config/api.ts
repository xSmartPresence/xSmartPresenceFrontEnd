// src/config/api.ts

export const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

if (!API_BASE) {
  throw new Error("VITE_API_BASE_URL is not set in .env");
}