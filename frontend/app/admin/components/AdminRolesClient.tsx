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
import { PermissionTree } from "./PermissionTree";

type RoleForm = {
  id: string;
  code: string;
  name: string;
  description: string;
  permissions: string;
};

type ModalState =
  | { type: "role-form"; mode: "create" | "edit" }
  | { type: "confirm-delete-role"; role: AdminRole }
  | null;

const emptyRoleForm: RoleForm = {
  id: "",
  code: "",
  name: "",
  description: "",
  permissions: "role.read\nuser.read",
};

export function AdminRolesClient({
  currentUser,
  roles,
}: {
  currentUser: AdminUser;
  roles: AdminRole[];
}) {
  const router = useRouter();
  const permissions = new Set(currentUser.role.permissions);
  const canCreateRoles = hasPermission(permissions, "role.create");
  const canUpdateRoles = hasPermission(permissions, "role.update");
  const canDeleteRoles = hasPermission(permissions, "role.delete");
  const [roleForm, setRoleForm] = useState<RoleForm>(emptyRoleForm);
  const [modal, setModal] = useState<ModalState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<AdminToastState>(null);

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
    if (modal?.type !== "role-form") {
      return;
    }
    setIsLoading(true);
    setToast(null);
    const payload = {
      name: roleForm.name,
      description: roleForm.description || null,
      permissions: parsePermissions(roleForm.permissions),
    };
    try {
      if (modal.mode === "edit") {
        await adminClientRequest<AdminRole>(`/api/intl/v1/admin/roles/${roleForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setToast({ message: "Admin role updated.", tone: "success" });
      } else {
        await adminClientRequest<AdminRole>("/api/intl/v1/admin/roles", {
          method: "POST",
          body: JSON.stringify({ ...payload, code: roleForm.code }),
        });
        setToast({ message: "Admin role created.", tone: "success" });
      }
      setModal(null);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to save role.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteRole(role: AdminRole) {
    setIsLoading(true);
    setToast(null);
    try {
      await adminClientRequest<{ id: string }>(`/api/intl/v1/admin/roles/${role.id}`, {
        method: "DELETE",
      });
      setModal(null);
      setToast({ message: "Admin role deleted.", tone: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to delete role.",
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
          <p className="admin-kicker">Access Control</p>
          <h2>Roles</h2>
        </div>
        <div className="admin-topbar-actions">
          <span>{roles.length} roles</span>
          {canCreateRoles ? (
            <button className="admin-primary-button" onClick={openCreateRole} type="button">
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
                      <button
                        aria-label={`Edit ${role.name}`}
                        disabled={isLoading}
                        onClick={() => openEditRole(role)}
                        title="Edit"
                        type="button"
                      >
                        <EditActionIcon />
                      </button>
                    ) : null}
                    {canDeleteRoles ? (
                      <button
                        aria-label={`Delete ${role.name}`}
                        className="is-danger"
                        disabled={isLoading || role.is_system}
                        onClick={() => setModal({ type: "confirm-delete-role", role })}
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

      {modal?.type === "confirm-delete-role" ? (
        <ConfirmModal
          body={`Delete ${modal.role.name}? Roles assigned to users or system roles cannot be deleted.`}
          isLoading={isLoading}
          onCancel={() => setModal(null)}
          onConfirm={() => void deleteRole(modal.role)}
          title="Delete role"
        />
      ) : null}
    </div>
  );
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
