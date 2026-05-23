import { AdminGalleryClient } from "../components/AdminContentClient";
import { AdminLoginClient } from "../components/AdminLoginClient";
import { AdminServerShell } from "../components/AdminServerShell";
import { adminApiRequest, getAdminToken, getCurrentAdminUser } from "../lib/api";
import { hasPermission } from "../lib/permissions";
import type { GalleryImageAdmin } from "../lib/types";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const token = await getAdminToken();
  if (!token) {
    return <AdminLoginClient redirectTo="/admin" />;
  }

  try {
    const currentUser = await getCurrentAdminUser(token);
    const images = hasPermission(currentUser.role.permissions, "gallery.read")
      ? await adminApiRequest<GalleryImageAdmin[]>("/api/intl/v1/gallery/images", token)
      : [];

    return (
      <AdminServerShell activeView="gallery" currentUser={currentUser}>
        <AdminGalleryClient currentUser={currentUser} images={images} />
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
