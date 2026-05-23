import { AdminLoginClient } from "../components/AdminLoginClient";
import { AdminRolesClient } from "../components/AdminRolesClient";
import { AdminServerShell } from "../components/AdminServerShell";
import { adminApiRequest, getAdminToken, getCurrentAdminUser } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import type { AdminRole } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  const token = await getAdminToken();
  if (!token) {
    return <AdminLoginClient redirectTo="/admin" />;
  }

  try {
    const currentUser = await getCurrentAdminUser(token);
    const roles = hasPermission(currentUser.role.permissions, "role.read")
      ? await adminApiRequest<AdminRole[]>("/api/intl/v1/admin/roles", token)
      : [];

    return (
      <AdminServerShell activeView="roles" currentUser={currentUser}>
        <AdminRolesClient currentUser={currentUser} roles={roles} />
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
