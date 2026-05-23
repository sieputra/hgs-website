"use client";

import { useEffect, useRef } from "react";

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
    label: "Services",
    permissions: ["service.read", "service.create", "service.update", "service.delete"],
  },
  {
    label: "FAQ",
    permissions: ["faq.read", "faq.create", "faq.update", "faq.delete"],
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

export function PermissionTree({
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
