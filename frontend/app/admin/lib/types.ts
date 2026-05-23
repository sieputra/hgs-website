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

export type CareerApplicationStatus =
  | "submitted"
  | "hr_interview"
  | "user_interview"
  | "offer"
  | "onboard"
  | "rejected"
  | "canceled";

export type CareerApplicationWorkExperienceAdmin = {
  id: string;
  company_name: string;
  position: string | null;
  employment_duration: string | null;
  salary: string | number | null;
  company_phone_number: string | null;
  leaving_reason: string | null;
  company_comment: string | null;
};

export type CareerApplicationSocialMediaAccountAdmin = {
  id: string;
  platform: string;
  account_id: string;
};

export type CareerApplicationFamilyMemberAdmin = {
  id: string;
  relationship: string;
  name: string;
  education_level: string | null;
  occupation: string | null;
  workplace: string | null;
};

export type CareerApplicationOrganizationExperienceAdmin = {
  id: string;
  organization_name: string;
  position: string | null;
  period: string | null;
};

export type CareerApplicationCommentAdmin = {
  id: string;
  admin_user_id: string | null;
  author_name: string | null;
  author_email: string | null;
  comment: string;
  created_at: string;
  updated_at: string;
};

export type CareerApplicationSummaryAdmin = {
  id: string;
  career_job_id: string | null;
  job_slug: string | null;
  job_title: string | null;
  job_location: string | null;
  job_employment_type: string | null;
  division_name: string | null;
  position_name: string | null;
  full_name: string;
  nickname: string;
  age: number;
  gender: string | null;
  phone_number: string;
  education_level: string | null;
  school_name: string | null;
  major: string | null;
  applied_position: string;
  alternative_applied_position: string | null;
  vacancy_source: string;
  preferred_area: string | null;
  available_interview_date: string | null;
  self_photo_url: string | null;
  cv_file_url: string | null;
  status: string;
  applied_at: string;
  created_at: string;
  updated_at: string;
};

export type CareerApplicationAdmin = CareerApplicationSummaryAdmin & {
  identity_number: string;
  identity_valid_until: string;
  identity_address: string;
  domicile_address: string;
  driving_license_number: string;
  driving_license_class: string | null;
  driving_license_valid_until: string;
  birth_place: string;
  birth_date: string;
  marital_status: string | null;
  mother_name: string;
  religion: string | null;
  medical_history: string | null;
  school_entry_year: number | null;
  school_graduation_year: number | null;
  school_address: string | null;
  grade_point_average: string | null;
  willing_to_be_placed_anywhere: boolean;
  interview_invitation_reason: string;
  social_media_accounts: CareerApplicationSocialMediaAccountAdmin[];
  family_members: CareerApplicationFamilyMemberAdmin[];
  organization_experiences: CareerApplicationOrganizationExperienceAdmin[];
  work_experiences: CareerApplicationWorkExperienceAdmin[];
  comments: CareerApplicationCommentAdmin[];
};

export type AdminView =
  | "dashboard"
  | "recruitment"
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
