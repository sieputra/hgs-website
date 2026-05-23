import { readAdminToken } from "./client-auth";
import type { ApiResponse } from "./types";

export async function adminClientRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = readAdminToken();
  if (!token) {
    throw new Error("Admin session ended.");
  }
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, {
    ...options,
    headers,
  });
  const payload = (await response.json()) as ApiResponse<T> | { detail?: unknown };
  if (!response.ok) {
    throw new Error(readErrorDetail(payload));
  }
  return (payload as ApiResponse<T>).data;
}

function readErrorDetail(payload: ApiResponse<unknown> | { detail?: unknown }) {
  if (!("detail" in payload)) {
    return "Request failed.";
  }
  if (typeof payload.detail === "string") {
    return payload.detail;
  }
  return "Request failed.";
}
