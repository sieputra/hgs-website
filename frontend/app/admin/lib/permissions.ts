export function hasPermission(permissions: string[] | Set<string>, permission: string) {
  const permissionSet = permissions instanceof Set ? permissions : new Set(permissions);
  return permissionSet.has("*") || permissionSet.has(permission);
}
