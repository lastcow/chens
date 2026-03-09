/**
 * ChensAPI client — all data operations go through ChensAPI.
 * Never call the database directly from the frontend.
 */

const API_BASE = process.env.CHENS_API_URL!;
const API_KEY = process.env.CHENS_API_SECRET_KEY!;

async function apiFetch(path: string, options: RequestInit = {}, userRole?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    ...(userRole ? { "x-user-role": userRole } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "API error");
  return data;
}

// Auth
export async function apiRegister(name: string, email: string, password: string) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function apiLogin(email: string, password: string) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiGoogleSignIn(email: string, name?: string | null, image?: string | null, oauth_provider?: string, oauth_id?: string) {
  return apiFetch("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ email, name, image, oauth_provider, oauth_id }),
  });
}

// Users (admin)
export async function apiGetUsers(adminRole: string) {
  return apiFetch("/api/users", {}, adminRole);
}

export async function apiGetUser(id: string) {
  return apiFetch(`/api/users/${id}`);
}

export async function apiUpdateUser(id: string, data: { name?: string; role?: string; image?: string; suspended?: boolean }, callerRole?: string) {
  return apiFetch(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }, callerRole);
}

export async function apiDeleteUser(id: string, adminRole: string) {
  return apiFetch(`/api/users/${id}`, { method: "DELETE" }, adminRole);
}

// Images
export async function apiGenerateImage(preset: string, aspectRatio = "16:9") {
  return apiFetch("/api/images/generate", {
    method: "POST",
    body: JSON.stringify({ preset, aspectRatio }),
  });
}
