import { AdminDivisionsClient } from "../components/AdminHumanResourcesClient";
import { AdminLoginClient } from "../components/AdminLoginClient";
import { AdminServerShell } from "../components/AdminServerShell";
import { adminApiRequest, getAdminToken, getCurrentAdminUser } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import type { DivisionAdmin } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDivisionsPage() {
  const token = await getAdminToken();
  if (!token) {
    return <AdminLoginClient redirectTo="/admin" />;
  }

  try {
    const currentUser = await getCurrentAdminUser(token);
    const divisions = hasPermission(currentUser.role.permissions, "division.read")
      ? await adminApiRequest<DivisionAdmin[]>("/api/intl/v1/divisions", token)
      : [];

    return (
      <AdminServerShell activeView="divisions" currentUser={currentUser}>
        <AdminDivisionsClient currentUser={currentUser} divisions={divisions} />
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
