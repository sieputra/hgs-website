import { AdminLoginClient } from "../components/AdminLoginClient";
import { AdminRecruitmentClient } from "../components/AdminRecruitmentClient";
import { AdminServerShell } from "../components/AdminServerShell";
import { adminApiRequest, getAdminToken, getCurrentAdminUser } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import type { CareerApplicationSummaryAdmin } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function AdminRecruitmentPage() {
  const token = await getAdminToken();
  if (!token) {
    return <AdminLoginClient redirectTo="/admin" />;
  }

  try {
    const currentUser = await getCurrentAdminUser(token);
    const applications = hasPermission(
      currentUser.role.permissions,
      "recruitment.read",
    )
      ? await adminApiRequest<CareerApplicationSummaryAdmin[]>(
          "/api/intl/v1/recruitment/applications",
          token,
        )
      : [];

    return (
      <AdminServerShell activeView="recruitment" currentUser={currentUser}>
        <AdminRecruitmentClient
          applications={applications}
          currentUser={currentUser}
        />
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
