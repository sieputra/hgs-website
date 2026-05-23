"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { clearAdminSession } from "../lib/client-auth";

type AdminDashboardNavIconName =
  | "content-management"
  | "dashboard"
  | "faqs"
  | "roles"
  | "services"
  | "user-management"
  | "users";

export type AdminDashboardNavLink = {
  href: string;
  id: string;
  label: string;
  icon: AdminDashboardNavIconName;
};

type AdminDashboardNavGroup = {
  children: AdminDashboardNavLink[];
  id: string;
  label: string;
  icon: AdminDashboardNavIconName;
};

export type AdminDashboardNavItem = AdminDashboardNavGroup | AdminDashboardNavLink;

export type AdminDashboardProfile = {
  email: string;
  fullName: string;
  roleName: string;
};

type AdminLeftNavbarProps = {
  activeNavItem: string;
  isCollapsed: boolean;
  navItems: AdminDashboardNavItem[];
  onToggle: () => void;
};

type AdminTopNavbarProps = {
  profile: AdminDashboardProfile;
};

type AdminDashboardShellProps = {
  activeNavItem: string;
  children: ReactNode;
  initialSidebarCollapsed?: boolean;
  navItems: AdminDashboardNavItem[];
  profile: AdminDashboardProfile;
};

export function AdminDashboardShell({
  activeNavItem,
  children,
  initialSidebarCollapsed = false,
  navItems,
  profile,
}: AdminDashboardShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(initialSidebarCollapsed);

  return (
    <main className={isSidebarCollapsed ? "admin-shell is-sidebar-collapsed" : "admin-shell"}>
      <AdminLeftNavbar
        activeNavItem={activeNavItem}
        isCollapsed={isSidebarCollapsed}
        navItems={navItems}
        onToggle={() => setIsSidebarCollapsed((value) => !value)}
      />
      <section className="admin-content">
        <AdminTopNavbar profile={profile} />
        {children}
      </section>
    </main>
  );
}

export function AdminLeftNavbar({
  activeNavItem,
  isCollapsed,
  navItems,
  onToggle,
}: AdminLeftNavbarProps) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-main">
        <div className="admin-brand">
          <p className="admin-kicker">HGS Admin</p>
          <h1>Dashboard</h1>
        </div>
        <nav aria-label="Admin sections" className="admin-nav">
          {navItems.map((item) =>
            "children" in item ? (
              <AdminNavGroup activeNavItem={activeNavItem} item={item} key={item.id} />
            ) : (
              <AdminNavLink activeNavItem={activeNavItem} item={item} key={item.id} />
            ),
          )}
        </nav>
      </div>
      <button
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="admin-sidebar-toggle"
        onClick={onToggle}
        type="button"
      >
        <SidebarToggleIcon isCollapsed={isCollapsed} />
        <strong>{isCollapsed ? "" : "Collapse"}</strong>
      </button>
    </aside>
  );
}

export function AdminTopNavbar({ profile }: AdminTopNavbarProps) {
  const router = useRouter();

  function signOut() {
    clearAdminSession();
    router.replace("/admin");
    router.refresh();
  }

  return (
    <header className="admin-appbar">
      <div>
        <p className="admin-kicker">Signed in</p>
        <strong>{profile.fullName}</strong>
      </div>
      <div className="admin-profile">
        <span>{profile.email}</span>
        <small>{profile.roleName}</small>
      </div>
      <button className="admin-secondary-button" onClick={signOut} type="button">
        Sign out
      </button>
    </header>
  );
}

function AdminNavLink({
  activeNavItem,
  item,
}: {
  activeNavItem: string;
  item: AdminDashboardNavLink;
}) {
  return (
    <Link
      aria-current={activeNavItem === item.id ? "page" : undefined}
      className={activeNavItem === item.id ? "admin-nav-link is-active" : "admin-nav-link"}
      href={item.href}
      title={item.label}
    >
      <span className="admin-nav-icon">
        <AdminNavIcon name={item.icon} />
      </span>
      <span className="admin-nav-label">{item.label}</span>
    </Link>
  );
}

function AdminNavGroup({
  activeNavItem,
  item,
}: {
  activeNavItem: string;
  item: AdminDashboardNavGroup;
}) {
  const isActive = item.children.some((child) => child.id === activeNavItem);
  const [isExpanded, setIsExpanded] = useState(isActive);
  const subitemsId = `admin-nav-group-${item.id}`;

  return (
    <section
      className={[
        "admin-nav-group",
        isActive ? "is-active" : "",
        isExpanded ? "is-expanded" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        aria-controls={subitemsId}
        aria-expanded={isExpanded}
        className="admin-nav-group-heading"
        onClick={() => setIsExpanded((value) => !value)}
        title={item.label}
        type="button"
      >
        <span className="admin-nav-icon">
          <AdminNavIcon name={item.icon} />
        </span>
        <span className="admin-nav-label">{item.label}</span>
        <ChevronIcon isExpanded={isExpanded} />
      </button>
      <div className="admin-nav-subitems" hidden={!isExpanded} id={subitemsId}>
        {item.children.map((child) => (
          <AdminNavLink activeNavItem={activeNavItem} item={child} key={child.id} />
        ))}
      </div>
    </section>
  );
}

function ChevronIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={isExpanded ? "admin-nav-chevron is-expanded" : "admin-nav-chevron"}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function SidebarToggleIcon({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="admin-sidebar-toggle-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect height="16" rx="2" width="16" x="4" y="4" />
      <path d={isCollapsed ? "M10 8l4 4-4 4" : "M14 8l-4 4 4 4"} />
      <path d="M8 5v14" />
    </svg>
  );
}

function AdminNavIcon({ name }: { name: AdminDashboardNavIconName }) {
  if (name === "dashboard") {
    return (
      <svg aria-hidden="true" className="admin-nav-svg" fill="none" viewBox="0 0 24 24">
        <rect height="7" rx="1.5" width="7" x="4" y="4" />
        <rect height="7" rx="1.5" width="7" x="13" y="4" />
        <rect height="7" rx="1.5" width="7" x="4" y="13" />
        <rect height="7" rx="1.5" width="7" x="13" y="13" />
      </svg>
    );
  }

  if (name === "user-management") {
    return (
      <svg aria-hidden="true" className="admin-nav-svg" fill="none" viewBox="0 0 24 24">
        <path d="M16 19c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4" />
        <circle cx="10" cy="8" r="3" />
        <path d="M18 8v6" />
        <path d="M15 11h6" />
      </svg>
    );
  }

  if (name === "content-management") {
    return (
      <svg aria-hidden="true" className="admin-nav-svg" fill="none" viewBox="0 0 24 24">
        <path d="M5 5h14v14H5z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
      </svg>
    );
  }

  if (name === "services") {
    return (
      <svg aria-hidden="true" className="admin-nav-svg" fill="none" viewBox="0 0 24 24">
        <path d="M4 7h16" />
        <path d="M6 7l1 11h10l1-11" />
        <path d="M9 7V5h6v2" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  if (name === "faqs") {
    return (
      <svg aria-hidden="true" className="admin-nav-svg" fill="none" viewBox="0 0 24 24">
        <path d="M5 5h14v11H8l-3 3V5z" />
        <path d="M10 9a2 2 0 1 1 2 2v1" />
        <path d="M12 15h.01" />
      </svg>
    );
  }

  if (name === "roles") {
    return (
      <svg aria-hidden="true" className="admin-nav-svg" fill="none" viewBox="0 0 24 24">
        <path d="M12 3l7 3v5c0 4.4-2.8 8.4-7 10-4.2-1.6-7-5.6-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="admin-nav-svg" fill="none" viewBox="0 0 24 24">
      <path d="M16 19c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4" />
      <circle cx="10" cy="8" r="3" />
      <path d="M20 18c0-1.8-1.2-3.3-3-3.8" />
      <path d="M15 5.2a3 3 0 0 1 0 5.6" />
    </svg>
  );
}
