import { API_BASE } from "../config/api";

// Tracks if a refresh is already in progress to prevent parallel refresh calls
let isRefreshing = false;
// Queue of requests that came in while a refresh was in progress
let refreshQueue: Array<(newToken: string) => void> = [];

/**
 * Attempts to get a new access token using the stored refresh token.
 * Returns the new access token string, or null if refresh failed.
 */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newToken = data.token || data.access_token;
    if (!newToken) return null;

    // Persist the new access token
    localStorage.setItem("token", newToken);

    // If the backend rotates the refresh token on each use, update it too
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }

    return newToken;
  } catch {
    return null;
  }
}

/**
 * Clears all auth data and redirects to login.
 */
function forceLogout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("email");
  localStorage.removeItem("org");
  window.location.href = "/";
}

/**
 * Central fetch wrapper used by all API calls in the app.
 *
 * NEW-H fix:
 *  - On 401 from a non-background endpoint, attempt POST /auth/refresh once.
 *  - If refresh succeeds, swap the access token and retry the original request.
 *  - If refresh itself returns 401 (expired/revoked), call forceLogout().
 *  - Background endpoints (/health, /dashboard polling) never trigger refresh
 *    or logout — same guard as before.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  // Background endpoints: polling calls that should never log the user out
  const isBackgroundRequest =
    endpoint.includes("/health") || endpoint.includes("/dashboard");

  const buildHeaders = (accessToken: string | null): HeadersInit => ({
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...(options.headers || {}),
  });

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      signal: controller.signal,
      ...options,
      headers: buildHeaders(token),
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  // ── 401 handling ────────────────────────────────────────────────────────────
  if (res.status === 401) {
    // Background requests (health checks, dashboard polls) are silently ignored
    // so they never kick the user out mid-session.
    if (isBackgroundRequest) {
      throw new Error("Session expired. Please log in again.");
    }

    // ✅ NEW-H FIX: Try to refresh before giving up.
    if (!isRefreshing) {
      // Only one refresh attempt at a time — other concurrent calls queue up.
      isRefreshing = true;

      const newToken = await tryRefreshToken();
      isRefreshing = false;

      if (newToken) {
        // Unblock any requests that were waiting for the refresh
        refreshQueue.forEach((resolve) => resolve(newToken));
        refreshQueue = [];

        // Retry the original request with the fresh token
        const retryRes = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers: buildHeaders(newToken),
        });

        if (!retryRes.ok) {
          const errData = await retryRes.json().catch(() => null);
          throw new Error(
            errData?.detail || errData?.message || `API request failed: ${retryRes.status}`
          );
        }

        return retryRes.json();
      } else {
        // Refresh failed — session is truly over
        refreshQueue = [];
        forceLogout();
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      // A refresh is already in progress — wait for it to finish, then retry
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push(async (newToken: string) => {
          try {
            const retryRes = await fetch(`${API_BASE}${endpoint}`, {
              ...options,
              headers: buildHeaders(newToken),
            });

            if (!retryRes.ok) {
              const errData = await retryRes.json().catch(() => null);
              reject(
                new Error(
                  errData?.detail ||
                    errData?.message ||
                    `API request failed: ${retryRes.status}`
                )
              );
              return;
            }

            resolve(await retryRes.json());
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  }
  // ── end 401 handling ────────────────────────────────────────────────────────

  if (res.status === 403) {
    throw new Error("Permission denied. You don't have access to this resource.");
  }

  if (res.status === 500) {
    throw new Error("Server error. Please try again later.");
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(
      errData?.detail || errData?.message || `API request failed: ${res.status}`
    );
  }

  return res.json();
}
