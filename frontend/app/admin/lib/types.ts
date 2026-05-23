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

export type PublicServiceAdmin = {
  id: string;
  code: string;
  title: string;
  summary: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FAQAdmin = {
  id: string;
  code: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type GalleryImageAdmin = {
  id: string;
  title: string;
  caption: string;
  image_url: string;
  image_alt: string;
  sort_order: number;
  original_filename: string | null;
  content_type: string | null;
  file_size: number | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type PositionAdmin = {
  id: string;
  division_id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DivisionAdmin = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  positions: PositionAdmin[];
  created_at: string;
  updated_at: string;
};

export type CareerJobAdmin = {
  id: string;
  division_id: string | null;
  position_id: string | null;
  code: string;
  slug: string;
  title: string;
  division_code: string;
  division_name: string;
  position_code: string;
  position_name: string;
  location: string;
  employment_type: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminView =
  | "dashboard"
  | "users"
  | "roles"
  | "services"
  | "faqs"
  | "gallery"
  | "divisions"
  | "positions"
  | "jobs";

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: AdminUser;
};
