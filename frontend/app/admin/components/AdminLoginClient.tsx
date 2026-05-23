"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { clearAdminSession, readAdminToken, storeAdminSession } from "../lib/client-auth";
import type { ApiResponse, LoginResponse } from "../lib/types";

export function AdminLoginClient({
  clearSessionOnMount = false,
  redirectTo,
  sessionNotice,
}: {
  clearSessionOnMount?: boolean;
  redirectTo: string;
  sessionNotice?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState(sessionNotice ?? "");

  useEffect(() => {
    if (clearSessionOnMount) {
      clearAdminSession();
      return;
    }
    const storedToken = readAdminToken();
    if (storedToken) {
      storeAdminSession(storedToken);
      router.refresh();
    }
  }, [clearSessionOnMount, router]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setNotice("");
    try {
      const payload = await apiRequest<LoginResponse>("/api/intl/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      storeAdminSession(payload.access_token);
      setPassword("");
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      clearAdminSession();
      setNotice(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-panel">
        <div>
          <p className="admin-kicker">HGS Admin</p>
          <h1>Sign in</h1>
        </div>
        <form className="admin-form" onSubmit={login}>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button className="admin-primary-button" disabled={isLoading} type="submit">
            {isLoading ? "Signing in" : "Sign in"}
          </button>
        </form>
        {notice ? <p className="admin-notice">{notice}</p> : null}
      </section>
    </main>
  );
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
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
