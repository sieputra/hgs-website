export const adminTokenStorageKey = "hgs_admin_token";

const tokenMaxAgeSeconds = 60 * 60 * 24 * 7;

export function storeAdminSession(token: string) {
  window.localStorage.setItem(adminTokenStorageKey, token);
  document.cookie = `${adminTokenStorageKey}=${encodeURIComponent(
    token,
  )}; path=/; max-age=${tokenMaxAgeSeconds}; SameSite=Lax`;
}

export function readAdminToken() {
  const storedToken = window.localStorage.getItem(adminTokenStorageKey);
  if (storedToken) {
    return storedToken;
  }
  const cookieToken = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${adminTokenStorageKey}=`))
    ?.split("=")[1];
  return cookieToken ? decodeURIComponent(cookieToken) : null;
}

export function clearAdminSession() {
  window.localStorage.removeItem(adminTokenStorageKey);
  document.cookie = `${adminTokenStorageKey}=; path=/; max-age=0; SameSite=Lax`;
}
