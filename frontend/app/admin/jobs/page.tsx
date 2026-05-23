import { AdminJobsClient } from "../components/AdminHumanResourcesClient";
import { AdminLoginClient } from "../components/AdminLoginClient";
import { AdminServerShell } from "../components/AdminServerShell";
import { adminApiRequest, getAdminToken, getCurrentAdminUser } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import type { CareerJobAdmin, DivisionAdmin, PositionAdmin } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const token = await getAdminToken();
  if (!token) {
    return <AdminLoginClient redirectTo="/admin" />;
  }

  try {
    const currentUser = await getCurrentAdminUser(token);
    const permissions = new Set(currentUser.role.permissions);
    const jobsPromise = hasPermission(permissions, "job.read")
      ? adminApiRequest<CareerJobAdmin[]>("/api/intl/v1/jobs", token)
      : Promise.resolve([]);
    const divisionsPromise = hasPermission(permissions, "division.read")
      ? adminApiRequest<DivisionAdmin[]>("/api/intl/v1/divisions", token)
      : Promise.resolve([]);
    const positionsPromise = hasPermission(permissions, "position.read")
      ? adminApiRequest<PositionAdmin[]>("/api/intl/v1/positions", token)
      : Promise.resolve([]);
    const [jobs, divisions, positions] = await Promise.all([
      jobsPromise,
      divisionsPromise,
      positionsPromise,
    ]);

    return (
      <AdminServerShell activeView="jobs" currentUser={currentUser}>
        <AdminJobsClient
          currentUser={currentUser}
          divisions={divisions}
          jobs={jobs}
          positions={positions}
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
