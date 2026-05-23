import { cookies } from "next/headers";

import { adminTokenStorageKey } from "./client-auth";
import type { AdminUser, ApiResponse } from "./types";

const apiBaseUrl = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000"
).replace(/\/$/, "");

export async function getAdminToken() {
  const cookieStore = await cookies();
  return cookieStore.get(adminTokenStorageKey)?.value ?? null;
}

export async function getCurrentAdminUser(token: string) {
  return adminApiRequest<AdminUser>("/api/intl/v1/auth/me", token);
}

export async function adminApiRequest<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const payload = (await response.json()) as ApiResponse<T> | { detail?: unknown };
  if (!response.ok) {
    throw new Error(readErrorDetail(payload));
  }
  return (payload as ApiResponse<T>).data;
}

export function readErrorDetail(payload: ApiResponse<unknown> | { detail?: unknown }) {
  if (!("detail" in payload)) {
    return "Request failed.";
  }
  if (typeof payload.detail === "string") {
    return payload.detail;
  }
  return "Request failed.";
}
