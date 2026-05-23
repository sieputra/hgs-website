import { AdminLoginClient } from "./components/AdminLoginClient";
import { AdminServerShell } from "./components/AdminServerShell";
import { getAdminToken, getCurrentAdminUser } from "./lib/api";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = await getAdminToken();
  if (!token) {
    return <AdminLoginClient redirectTo="/admin" />;
  }

  try {
    const currentUser = await getCurrentAdminUser(token);

    return (
      <AdminServerShell activeView="dashboard" currentUser={currentUser}>
        <div className="admin-content-body">
          <h2>Dashboard</h2>
        </div>
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
