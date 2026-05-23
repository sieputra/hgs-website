"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { adminClientRequest } from "../lib/client-api";
import { hasPermission } from "../lib/permissions";
import type { AdminRole, AdminUser } from "../lib/types";
import { DeleteActionIcon, EditActionIcon } from "./AdminActionIcons";
import { AdminModal, ConfirmModal, ModalActions } from "./AdminModal";
import { AdminToast, type AdminToastState } from "./AdminToast";

type UserForm = {
  id: string;
  email: string;
  full_name: string;
  password: string;
  role_code: string;
  is_active: boolean;
};

type ModalState =
  | { type: "user-form"; mode: "create" | "edit" }
  | { type: "confirm-delete-user"; user: AdminUser }
  | null;

const emptyUserForm: UserForm = {
  id: "",
  email: "",
  full_name: "",
  password: "",
  role_code: "admin",
  is_active: true,
};

export function AdminUsersClient({
  currentUser,
  roles,
  users,
}: {
  currentUser: AdminUser;
  roles: AdminRole[];
  users: AdminUser[];
}) {
  const router = useRouter();
  const permissions = new Set(currentUser.role.permissions);
  const canReadUsers = hasPermission(permissions, "user.read");
  const canCreateUsers = hasPermission(permissions, "user.create");
  const canUpdateUsers = hasPermission(permissions, "user.update");
  const canDeleteUsers = hasPermission(permissions, "user.delete");
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [modal, setModal] = useState<ModalState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<AdminToastState>(null);

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
    if (modal?.type !== "user-form") {
      return;
    }
    setIsLoading(true);
    setToast(null);
    try {
      if (modal.mode === "create") {
        await adminClientRequest<AdminUser>("/api/intl/v1/admin/users", {
          method: "POST",
          body: JSON.stringify(userForm),
        });
        setToast({ message: "Admin user created.", tone: "success" });
      } else {
        await adminClientRequest<AdminUser>(`/api/intl/v1/admin/users/${userForm.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            full_name: userForm.full_name,
            role_code: userForm.role_code,
            is_active: userForm.is_active,
            ...(userForm.password ? { password: userForm.password } : {}),
          }),
        });
        setToast({ message: "Admin user updated.", tone: "success" });
      }
      setModal(null);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to save user.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteUser(user: AdminUser) {
    setIsLoading(true);
    setToast(null);
    try {
      await adminClientRequest<{ id: string }>(`/api/intl/v1/admin/users/${user.id}`, {
        method: "DELETE",
      });
      setModal(null);
      setToast({ message: "Admin user deleted.", tone: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to delete user.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="admin-content-body">
      <AdminToast onClose={() => setToast(null)} toast={toast} />
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">User Management</p>
          <h2>Users</h2>
        </div>
        <div className="admin-topbar-actions">
          <span>{users.length} users</span>
          {canCreateUsers ? (
            <button className="admin-primary-button" onClick={openCreateUser} type="button">
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
                        <button
                          aria-label={`Edit ${user.full_name}`}
                          disabled={isLoading}
                          onClick={() => openEditUser(user)}
                          title="Edit"
                          type="button"
                        >
                          <EditActionIcon />
                        </button>
                      ) : null}
                      {canDeleteUsers ? (
                        <button
                          className="is-danger"
                          disabled={isLoading}
                          aria-label={`Delete ${user.full_name}`}
                          onClick={() => setModal({ type: "confirm-delete-user", user })}
                          title="Delete"
                          type="button"
                        >
                          <DeleteActionIcon />
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

      {modal?.type === "confirm-delete-user" ? (
        <ConfirmModal
          body={`Delete ${modal.user.full_name}? This removes the admin login account.`}
          isLoading={isLoading}
          onCancel={() => setModal(null)}
          onConfirm={() => void deleteUser(modal.user)}
          title="Delete user"
        />
      ) : null}
    </div>
  );
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
