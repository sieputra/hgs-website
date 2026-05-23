import { AdminLoginClient } from "../components/AdminLoginClient";
import { AdminServerShell } from "../components/AdminServerShell";
import { AdminUsersClient } from "../components/AdminUsersClient";
import { adminApiRequest, getAdminToken, getCurrentAdminUser } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import type { AdminRole, AdminUser } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const token = await getAdminToken();
  if (!token) {
    return <AdminLoginClient redirectTo="/admin" />;
  }

  try {
    const currentUser = await getCurrentAdminUser(token);
    const permissions = new Set(currentUser.role.permissions);
    const usersPromise = hasPermission(permissions, "user.read")
      ? adminApiRequest<AdminUser[]>("/api/intl/v1/users", token)
      : Promise.resolve([]);
    const rolesPromise = adminApiRequest<AdminRole[]>(
      "/api/intl/v1/roles",
      token,
    ).catch(() => []);
    const [users, roles] = await Promise.all([usersPromise, rolesPromise]);

    return (
      <AdminServerShell activeView="users" currentUser={currentUser}>
        <AdminUsersClient currentUser={currentUser} roles={roles} users={users} />
      </AdminServerShell>
    );
  } catch {
    return (
      <AdminLoginClient
        clearSessionOnMount
        redirectTo="/admin"
        sessionNotice="Admin session ended. Please sign in again."
      />
    );
  }
}
