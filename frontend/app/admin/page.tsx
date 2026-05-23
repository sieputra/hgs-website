"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
};

type AdminRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
};

type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: AdminRole;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  user: AdminUser;
};

type AdminView = "users" | "roles";
type ModalState =
  | { type: "user-form"; mode: "create" | "edit" }
  | { type: "role-form"; mode: "create" | "edit" }
  | { type: "confirm-delete-user"; user: AdminUser }
  | { type: "confirm-delete-role"; role: AdminRole }
  | null;

const tokenStorageKey = "hgs_admin_token";
const permissionGroups = [
  {
    label: "Roles",
    permissions: ["role.read", "role.create", "role.update", "role.delete"],
  },
  {
    label: "Users",
    permissions: ["user.read", "user.create", "user.update", "user.delete"],
  },
  {
    label: "Gallery",
    permissions: ["gallery.read", "gallery.create"],
  },
  {
    label: "Recruitment",
    permissions: ["recruitment.read", "recruitment.update"],
  },
];

const emptyUserForm = {
  id: "",
  email: "",
  full_name: "",
  password: "",
  role_code: "admin",
  is_active: true,
};

const emptyRoleForm = {
  id: "",
  code: "",
  name: "",
  description: "",
  permissions: "role.read\nuser.read",
};

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [activeView, setActiveView] = useState<AdminView>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [roleForm, setRoleForm] = useState(emptyRoleForm);
  const [modal, setModal] = useState<ModalState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const permissions = useMemo(
    () => new Set(currentUser?.role.permissions ?? []),
    [currentUser],
  );
  const canReadUsers = hasPermission(permissions, "user.read");
  const canCreateUsers = hasPermission(permissions, "user.create");
  const canUpdateUsers = hasPermission(permissions, "user.update");
  const canDeleteUsers = hasPermission(permissions, "user.delete");
  const canCreateRoles = hasPermission(permissions, "role.create");
  const canUpdateRoles = hasPermission(permissions, "role.update");
  const canDeleteRoles = hasPermission(permissions, "role.delete");

  useEffect(() => {
    const storedToken = window.localStorage.getItem(tokenStorageKey);
    if (storedToken) {
      setToken(storedToken);
      void loadDashboard(storedToken);
    }
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setNotice("");
    try {
      const payload = await apiRequest<LoginResponse>("/api/intl/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      window.localStorage.setItem(tokenStorageKey, payload.access_token);
      setToken(payload.access_token);
      setCurrentUser(payload.user);
      setPassword("");
      await loadDashboard(payload.access_token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDashboard(activeToken: string) {
    setIsLoading(true);
    setNotice("");
    try {
      const [mePayload, rolePayload, userPayload] = await Promise.all([
        apiRequest<AdminUser>("/api/intl/v1/auth/me", { token: activeToken }),
        apiRequest<AdminRole[]>("/api/intl/v1/admin/roles", { token: activeToken }),
        apiRequest<AdminUser[]>("/api/intl/v1/admin/users", { token: activeToken }),
      ]);
      setCurrentUser(mePayload);
      setRoles(rolePayload);
      setUsers(userPayload);
      setUserForm((value) => ({
        ...value,
        role_code: value.role_code || rolePayload[0]?.code || "admin",
      }));
    } catch (error) {
      logout();
      setNotice(error instanceof Error ? error.message : "Admin session ended.");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateUser() {
    setUserForm({
      ...emptyUserForm,
      role_code: roles[0]?.code ?? "admin",
    });
    setModal({ type: "user-form", mode: "create" });
  }

  function openEditUser(user: AdminUser) {
    setUserForm({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      password: "",
      role_code: user.role.code,
      is_active: user.is_active,
    });
    setModal({ type: "user-form", mode: "edit" });
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || modal?.type !== "user-form") {
      return;
    }
    setIsLoading(true);
    setNotice("");
    try {
      if (modal.mode === "create") {
        await apiRequest<AdminUser>("/api/intl/v1/admin/users", {
          method: "POST",
          token,
          body: JSON.stringify(userForm),
        });
        setNotice("Admin user created.");
      } else {
        await apiRequest<AdminUser>(`/api/intl/v1/admin/users/${userForm.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify({
            full_name: userForm.full_name,
            role_code: userForm.role_code,
            is_active: userForm.is_active,
            ...(userForm.password ? { password: userForm.password } : {}),
          }),
        });
        setNotice("Admin user updated.");
      }
      setModal(null);
      await loadDashboard(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save user.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!token) {
      return;
    }
    setIsLoading(true);
    setNotice("");
    try {
      await apiRequest<{ id: string }>(`/api/intl/v1/admin/users/${user.id}`, {
        method: "DELETE",
        token,
      });
      setModal(null);
      await loadDashboard(token);
      setNotice("Admin user deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to delete user.");
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateRole() {
    setRoleForm(emptyRoleForm);
    setModal({ type: "role-form", mode: "create" });
  }

  function openEditRole(role: AdminRole) {
    setRoleForm({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description ?? "",
      permissions: role.permissions.join("\n"),
    });
    setModal({ type: "role-form", mode: "edit" });
  }

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || modal?.type !== "role-form") {
      return;
    }
    setIsLoading(true);
    setNotice("");
    const payload = {
      name: roleForm.name,
      description: roleForm.description || null,
      permissions: parsePermissions(roleForm.permissions),
    };
    try {
      if (modal.mode === "edit") {
        await apiRequest<AdminRole>(`/api/intl/v1/admin/roles/${roleForm.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(payload),
        });
        setNotice("Admin role updated.");
      } else {
        await apiRequest<AdminRole>("/api/intl/v1/admin/roles", {
          method: "POST",
          token,
          body: JSON.stringify({ ...payload, code: roleForm.code }),
        });
        setNotice("Admin role created.");
      }
      setModal(null);
      await loadDashboard(token);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save role.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteRole(role: AdminRole) {
    if (!token) {
      return;
    }
    setIsLoading(true);
    setNotice("");
    try {
      await apiRequest<{ id: string }>(`/api/intl/v1/admin/roles/${role.id}`, {
        method: "DELETE",
        token,
      });
      setModal(null);
      await loadDashboard(token);
      setNotice("Admin role deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to delete role.");
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem(tokenStorageKey);
    setToken(null);
    setCurrentUser(null);
    setUsers([]);
    setRoles([]);
    setModal(null);
  }

  if (!token || !currentUser) {
    return (
      <main className="admin-shell admin-login-shell">
        <section className="admin-login-panel">
          <div>
            <p className="admin-kicker">HGS Admin</p>
            <h1>Sign in</h1>
          </div>
          <form className="admin-form" onSubmit={login}>
            <label>
              Email
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            <label>
              Password
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>
            <button className="admin-primary-button" disabled={isLoading} type="submit">
              {isLoading ? "Signing in" : "Sign in"}
            </button>
          </form>
          {notice ? <p className="admin-notice">{notice}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className={isSidebarCollapsed ? "admin-shell is-sidebar-collapsed" : "admin-shell"}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-main">
          <div className="admin-brand">
            <p className="admin-kicker">HGS Admin</p>
            <h1>Dashboard</h1>
          </div>
          <nav aria-label="Admin sections" className="admin-nav">
            <button
              className={activeView === "users" ? "is-active" : ""}
              onClick={() => setActiveView("users")}
              title="Users"
              type="button"
            >
              <span className="admin-nav-icon">U</span>
              <span className="admin-nav-label">Users</span>
            </button>
            <button
              className={activeView === "roles" ? "is-active" : ""}
              onClick={() => setActiveView("roles")}
              title="Roles"
              type="button"
            >
              <span className="admin-nav-icon">R</span>
              <span className="admin-nav-label">Roles</span>
            </button>
          </nav>
        </div>
        <button
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="admin-sidebar-toggle"
          onClick={() => setIsSidebarCollapsed((value) => !value)}
          type="button"
        >
          <SidebarToggleIcon isCollapsed={isSidebarCollapsed} />
          <strong>{isSidebarCollapsed ? "" : "Collapse"}</strong>
        </button>
      </aside>

      <section className="admin-content">
        <header className="admin-appbar">
          <div>
            <p className="admin-kicker">Signed in</p>
            <strong>{currentUser.full_name}</strong>
          </div>
          <div className="admin-profile">
            <span>{currentUser.email}</span>
            <small>{currentUser.role.name}</small>
          </div>
          <button className="admin-secondary-button" onClick={logout} type="button">
            Sign out
          </button>
        </header>
        <div className="admin-content-body">
          {notice ? <p className="admin-notice">{notice}</p> : null}
          {activeView === "users" ? (
            <UsersView
              canCreateUsers={canCreateUsers}
              canDeleteUsers={canDeleteUsers}
              canReadUsers={canReadUsers}
              canUpdateUsers={canUpdateUsers}
              isLoading={isLoading}
              onCreate={openCreateUser}
              onDelete={(user) => setModal({ type: "confirm-delete-user", user })}
              onEdit={openEditUser}
              roles={roles}
              users={users}
            />
          ) : (
            <RolesView
              canCreateRoles={canCreateRoles}
              canDeleteRoles={canDeleteRoles}
              canUpdateRoles={canUpdateRoles}
              isLoading={isLoading}
              onCreate={openCreateRole}
              onDelete={(role) => setModal({ type: "confirm-delete-role", role })}
              onEdit={openEditRole}
              roles={roles}
            />
          )}
        </div>
      </section>

      {modal?.type === "user-form" ? (
        <AdminModal
          onClose={() => setModal(null)}
          title={modal.mode === "create" ? "Create user" : "Edit user"}
        >
          <form className="admin-form" onSubmit={saveUser}>
            <label>
              Full name
              <input
                onChange={(event) =>
                  setUserForm((value) => ({
                    ...value,
                    full_name: event.target.value,
                  }))
                }
                required
                value={userForm.full_name}
              />
            </label>
            <label>
              Email
              <input
                disabled={modal.mode === "edit"}
                onChange={(event) =>
                  setUserForm((value) => ({ ...value, email: event.target.value }))
                }
                required
                type="email"
                value={userForm.email}
              />
            </label>
            <label>
              Password
              <input
                minLength={12}
                onChange={(event) =>
                  setUserForm((value) => ({
                    ...value,
                    password: event.target.value,
                  }))
                }
                required={modal.mode === "create"}
                type="password"
                value={userForm.password}
              />
            </label>
            <label>
              Role
              <select
                onChange={(event) =>
                  setUserForm((value) => ({
                    ...value,
                    role_code: event.target.value,
                  }))
                }
                value={userForm.role_code}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.code}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-toggle">
              <input
                checked={userForm.is_active}
                onChange={(event) =>
                  setUserForm((value) => ({
                    ...value,
                    is_active: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>Active account</span>
            </label>
            <ModalActions isLoading={isLoading} onCancel={() => setModal(null)} />
          </form>
        </AdminModal>
      ) : null}

      {modal?.type === "role-form" ? (
        <AdminModal
          onClose={() => setModal(null)}
          title={modal.mode === "create" ? "Create role" : "Edit role"}
        >
          <form className="admin-form" onSubmit={saveRole}>
            <div className="admin-role-form-layout">
              <div className="admin-role-form-fields">
                <label>
                  Code
                  <input
                    disabled={modal.mode === "edit"}
                    onChange={(event) =>
                      setRoleForm((value) => ({
                        ...value,
                        code: event.target.value,
                      }))
                    }
                    required
                    value={roleForm.code}
                  />
                </label>
                <label>
                  Name
                  <input
                    onChange={(event) =>
                      setRoleForm((value) => ({
                        ...value,
                        name: event.target.value,
                      }))
                    }
                    required
                    value={roleForm.name}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    onChange={(event) =>
                      setRoleForm((value) => ({
                        ...value,
                        description: event.target.value,
                      }))
                    }
                    rows={5}
                    value={roleForm.description}
                  />
                </label>
              </div>
              <PermissionTree
                onChange={(permissions) =>
                  setRoleForm((value) => ({
                    ...value,
                    permissions: permissions.join("\n"),
                  }))
                }
                value={parsePermissions(roleForm.permissions)}
              />
            </div>
            <ModalActions isLoading={isLoading} onCancel={() => setModal(null)} />
          </form>
        </AdminModal>
      ) : null}

      {modal?.type === "confirm-delete-user" ? (
        <ConfirmModal
          body={`Delete ${modal.user.full_name}? This removes the admin login account.`}
          isLoading={isLoading}
          onCancel={() => setModal(null)}
          onConfirm={() => void deleteUser(modal.user)}
          title="Delete user"
        />
      ) : null}

      {modal?.type === "confirm-delete-role" ? (
        <ConfirmModal
          body={`Delete ${modal.role.name}? Roles assigned to users or system roles cannot be deleted.`}
          isLoading={isLoading}
          onCancel={() => setModal(null)}
          onConfirm={() => void deleteRole(modal.role)}
          title="Delete role"
        />
      ) : null}
    </main>
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

function PermissionTree({
  onChange,
  value,
}: {
  onChange: (permissions: string[]) => void;
  value: string[];
}) {
  const selectedPermissions = new Set(value);
  const hasAllPermissions = selectedPermissions.has("*");

  function setAllPermissions(checked: boolean) {
    onChange(checked ? ["*"] : []);
  }

  function setGroupPermissions(permissions: string[], checked: boolean) {
    const nextPermissions = new Set(
      Array.from(selectedPermissions).filter((permission) => permission !== "*"),
    );
    permissions.forEach((permission) => {
      if (checked) {
        nextPermissions.add(permission);
      } else {
        nextPermissions.delete(permission);
      }
    });
    onChange(Array.from(nextPermissions));
  }

  function setPermission(permission: string, checked: boolean) {
    const nextPermissions = new Set(
      Array.from(selectedPermissions).filter((item) => item !== "*"),
    );
    if (checked) {
      nextPermissions.add(permission);
    } else {
      nextPermissions.delete(permission);
    }
    onChange(Array.from(nextPermissions));
  }

  return (
    <section className="admin-permission-tree" aria-label="Permissions">
      <p className="admin-field-label">Permissions</p>
      <label className="admin-permission-root">
        <input
          checked={hasAllPermissions}
          onChange={(event) => setAllPermissions(event.target.checked)}
          type="checkbox"
        />
        <span>
          <strong>All permissions</strong>
          <small>Grants unrestricted admin access.</small>
        </span>
      </label>
      <div className="admin-permission-groups">
        {permissionGroups.map((group) => {
          const selectedCount = group.permissions.filter((permission) =>
            selectedPermissions.has(permission),
          ).length;
          const isChecked =
            hasAllPermissions || selectedCount === group.permissions.length;
          const isIndeterminate =
            !hasAllPermissions && selectedCount > 0 && selectedCount < group.permissions.length;

          return (
            <PermissionGroup
              isChecked={isChecked}
              isDisabled={hasAllPermissions}
              isIndeterminate={isIndeterminate}
              key={group.label}
              label={group.label}
              onGroupChange={(checked) => setGroupPermissions(group.permissions, checked)}
              onPermissionChange={setPermission}
              permissions={group.permissions}
              selectedPermissions={selectedPermissions}
            />
          );
        })}
      </div>
    </section>
  );
}

function PermissionGroup({
  isChecked,
  isDisabled,
  isIndeterminate,
  label,
  onGroupChange,
  onPermissionChange,
  permissions,
  selectedPermissions,
}: {
  isChecked: boolean;
  isDisabled: boolean;
  isIndeterminate: boolean;
  label: string;
  onGroupChange: (checked: boolean) => void;
  onPermissionChange: (permission: string, checked: boolean) => void;
  permissions: string[];
  selectedPermissions: Set<string>;
}) {
  const checkboxRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <article className="admin-permission-group">
      <label className="admin-permission-group-head">
        <input
          checked={isChecked}
          disabled={isDisabled}
          onChange={(event) => onGroupChange(event.target.checked)}
          ref={checkboxRef}
          type="checkbox"
        />
        <span>
          <strong>{label}</strong>
          <small>{permissions.length} permissions</small>
        </span>
      </label>
      <div className="admin-permission-children">
        {permissions.map((permission) => (
          <label className="admin-permission-leaf" key={permission}>
            <input
              checked={isDisabled || selectedPermissions.has(permission)}
              disabled={isDisabled}
              onChange={(event) => onPermissionChange(permission, event.target.checked)}
              type="checkbox"
            />
            <span>{permission}</span>
          </label>
        ))}
      </div>
    </article>
  );
}

function UsersView({
  canCreateUsers,
  canDeleteUsers,
  canReadUsers,
  canUpdateUsers,
  isLoading,
  onCreate,
  onDelete,
  onEdit,
  roles,
  users,
}: {
  canCreateUsers: boolean;
  canDeleteUsers: boolean;
  canReadUsers: boolean;
  canUpdateUsers: boolean;
  isLoading: boolean;
  onCreate: () => void;
  onDelete: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  roles: AdminRole[];
  users: AdminUser[];
}) {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">User Management</p>
          <h2>Users</h2>
        </div>
        <div className="admin-topbar-actions">
          <span>{users.length} users</span>
          {canCreateUsers ? (
            <button className="admin-primary-button" onClick={onCreate} type="button">
              New user
            </button>
          ) : null}
        </div>
      </header>

      {canReadUsers ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.full_name}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>{roles.find((role) => role.code === user.role.code)?.name ?? user.role.name}</td>
                  <td>
                    <span className={user.is_active ? "admin-status is-active" : "admin-status"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{formatDate(user.last_login_at)}</td>
                  <td>
                    <div className="admin-table-actions">
                      {canUpdateUsers ? (
                        <button disabled={isLoading} onClick={() => onEdit(user)} type="button">
                          Edit
                        </button>
                      ) : null}
                      {canDeleteUsers ? (
                        <button
                          className="is-danger"
                          disabled={isLoading}
                          onClick={() => onDelete(user)}
                          type="button"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

function RolesView({
  canCreateRoles,
  canDeleteRoles,
  canUpdateRoles,
  isLoading,
  onCreate,
  onDelete,
  onEdit,
  roles,
}: {
  canCreateRoles: boolean;
  canDeleteRoles: boolean;
  canUpdateRoles: boolean;
  isLoading: boolean;
  onCreate: () => void;
  onDelete: (role: AdminRole) => void;
  onEdit: (role: AdminRole) => void;
  roles: AdminRole[];
}) {
  return (
    <>
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">Access Control</p>
          <h2>Roles</h2>
        </div>
        <div className="admin-topbar-actions">
          <span>{roles.length} roles</span>
          {canCreateRoles ? (
            <button className="admin-primary-button" onClick={onCreate} type="button">
              New role
            </button>
          ) : null}
        </div>
      </header>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Type</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td>
                  <strong>{role.name}</strong>
                  {role.description ? <small>{role.description}</small> : null}
                </td>
                <td>{role.code}</td>
                <td>{role.is_system ? "System" : "Custom"}</td>
                <td>
                  <div className="admin-permission-summary">
                    {role.permissions.slice(0, 4).map((permission) => (
                      <span key={permission}>{permission}</span>
                    ))}
                    {role.permissions.length > 4 ? <em>+{role.permissions.length - 4}</em> : null}
                  </div>
                </td>
                <td>
                  <div className="admin-table-actions">
                    {canUpdateRoles ? (
                      <button disabled={isLoading} onClick={() => onEdit(role)} type="button">
                        Edit
                      </button>
                    ) : null}
                    {canDeleteRoles ? (
                      <button
                        className="is-danger"
                        disabled={isLoading || role.is_system}
                        onClick={() => onDelete(role)}
                        type="button"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AdminModal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div aria-modal="true" className="admin-modal-backdrop" role="dialog">
      <section className="admin-modal">
        <header className="admin-modal-head">
          <h3>{title}</h3>
          <button aria-label="Close" onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="admin-close-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M7 7l10 10" />
      <path d="M17 7L7 17" />
    </svg>
  );
}

function ConfirmModal({
  body,
  isLoading,
  onCancel,
  onConfirm,
  title,
}: {
  body: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <AdminModal onClose={onCancel} title={title}>
      <p className="admin-confirm-copy">{body}</p>
      <div className="admin-modal-actions">
        <button className="admin-text-button" onClick={onCancel} type="button">
          Cancel
        </button>
        <button
          className="admin-danger-button"
          disabled={isLoading}
          onClick={onConfirm}
          type="button"
        >
          Delete
        </button>
      </div>
    </AdminModal>
  );
}

function ModalActions({
  isLoading,
  onCancel,
}: {
  isLoading: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="admin-modal-actions">
      <button className="admin-text-button" onClick={onCancel} type="button">
        Cancel
      </button>
      <button className="admin-primary-button" disabled={isLoading} type="submit">
        Save
      </button>
    </div>
  );
}

async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });
  const payload = (await response.json()) as ApiResponse<T> | { detail?: unknown };
  if (!response.ok) {
    throw new Error(readErrorDetail(payload));
  }
  return (payload as ApiResponse<T>).data;
}

function parsePermissions(value: string) {
  const permissions = Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((permission) => permission.trim())
        .filter(Boolean),
    ),
  );
  return permissions.includes("*") ? ["*"] : permissions;
}

function hasPermission(permissions: Set<string>, permission: string) {
  return permissions.has("*") || permissions.has(permission);
}

function readErrorDetail(payload: ApiResponse<unknown> | { detail?: unknown }) {
  if (!("detail" in payload)) {
    return "Request failed.";
  }
  if (typeof payload.detail === "string") {
    return payload.detail;
  }
  return "Request failed.";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
