import { AdminFaqsClient } from "../components/AdminContentClient";
import { AdminLoginClient } from "../components/AdminLoginClient";
import { AdminServerShell } from "../components/AdminServerShell";
import { adminApiRequest, getAdminToken, getCurrentAdminUser } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import type { FAQAdmin } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const token = await getAdminToken();
  if (!token) {
    return <AdminLoginClient redirectTo="/admin" />;
  }

  try {
    const currentUser = await getCurrentAdminUser(token);
    const faqs = hasPermission(currentUser.role.permissions, "faq.read")
      ? await adminApiRequest<FAQAdmin[]>("/api/intl/v1/faqs", token)
      : [];

    return (
      <AdminServerShell activeView="faqs" currentUser={currentUser}>
        <AdminFaqsClient currentUser={currentUser} faqs={faqs} />
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
