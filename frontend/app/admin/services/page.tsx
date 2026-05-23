import { AdminServicesClient } from "../components/AdminContentClient";
import { AdminLoginClient } from "../components/AdminLoginClient";
import { AdminServerShell } from "../components/AdminServerShell";
import { adminApiRequest, getAdminToken, getCurrentAdminUser } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import type { PublicServiceAdmin } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const token = await getAdminToken();
  if (!token) {
    return <AdminLoginClient redirectTo="/admin" />;
  }

  try {
    const currentUser = await getCurrentAdminUser(token);
    const services = hasPermission(currentUser.role.permissions, "service.read")
      ? await adminApiRequest<PublicServiceAdmin[]>("/api/intl/v1/services", token)
      : [];

    return (
      <AdminServerShell activeView="services" currentUser={currentUser}>
        <AdminServicesClient currentUser={currentUser} services={services} />
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
