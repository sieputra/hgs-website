export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  meta: Record<string, unknown>;
};

export type AdminRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
};

export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: AdminRole;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminView = "dashboard" | "users" | "roles";

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: AdminUser;
};
