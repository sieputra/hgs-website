import type { ReactNode } from "react";

import type { AdminUser, AdminView } from "../lib/types";
import {
  AdminDashboardShell,
  type AdminDashboardNavItem,
} from "./AdminDashboardShell";

const adminNavItems: AdminDashboardNavItem[] = [
  {
    href: "/admin",
    id: "dashboard",
    icon: "dashboard",
    label: "Dashboard",
  },
  {
    children: [
      {
        href: "/admin/services",
        id: "services",
        icon: "services",
        label: "Services",
      },
      {
        href: "/admin/faqs",
        id: "faqs",
        icon: "faqs",
        label: "FAQ",
      },
    ],
    icon: "content-management",
    id: "content-management",
    label: "Content Management",
  },
  {
    children: [
      {
        href: "/admin/users",
        id: "users",
        icon: "users",
        label: "Users",
      },
      {
        href: "/admin/roles",
        id: "roles",
        icon: "roles",
        label: "Roles",
      },
    ],
    icon: "user-management",
    id: "user-management",
    label: "User Management",
  },
];

export function AdminServerShell({
  activeView,
  children,
  currentUser,
}: {
  activeView: AdminView;
  children: ReactNode;
  currentUser: AdminUser;
}) {
  return (
    <AdminDashboardShell
      activeNavItem={activeView}
      navItems={adminNavItems}
      profile={{
        email: currentUser.email,
        fullName: currentUser.full_name,
        roleName: currentUser.role.name,
      }}
    >
      {children}
    </AdminDashboardShell>
  );
}
