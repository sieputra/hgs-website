# Database Design

## Current Backend Integration

The backend uses SQLAlchemy with PostgreSQL through the `psycopg` driver.
Alembic owns schema migrations and seed data migrations. `DATABASE_URL` is read
from `backend/.env.dev` or the shell environment.

```bash
cd backend
python -m app.db.seed
```

`python -m app.db.seed` delegates to `alembic upgrade head`. The current
revision chain creates the initial schema and seeds `services`, `faqs`,
`gallery_images`, `divisions`, `positions`, `career_jobs`, and built-in
`admin_roles`. Contact and career application submissions are inserted through
the EXTL API once PostgreSQL is enabled.

## Recommended Tables

### Public

- `services`
- `testimonials`
- `clients`
- `contacts`
- `faqs`
- `gallery_images`
- `career_jobs`
- `career_applications`
- `career_application_work_experiences`

### Internal

- `admin_users`
- `employees`
- `divisions`
- `positions`
- `admin_roles`
- `audit_logs`
- `cms_pages`
- `media_assets`
- `internal_job_transfer_applications`

## Public Content Tables

## Internal Admin Tables

### `admin_roles`

Use `admin_roles` for RBAC role definitions used by the INTL admin API.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `code` | VARCHAR(80) | Yes | Stable role code, such as `super_admin`. |
| `name` | VARCHAR(120) | Yes | Role display name. |
| `description` | TEXT | No | Short role purpose. |
| `permissions` | JSONB | Yes | Permission codes, or `*` for full access. |
| `is_system` | BOOLEAN | Yes | Marks built-in roles. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

Built-in role codes are `super_admin`, `admin`, `content_admin`, and
`recruitment_admin`. Custom roles can be created from the admin dashboard, and
role name, description, and permissions can be edited after creation. System
roles cannot be deleted. Human Resources permissions use `division.read`,
`division.create`, `division.update`, `division.delete`, `position.read`,
`position.create`, `position.update`, `position.delete`, `job.read`,
`job.create`, `job.update`, and `job.delete`.

### `admin_users`

Use `admin_users` for dashboard login accounts.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `role_id` | UUID | Yes | Links to `admin_roles`. |
| `email` | VARCHAR(150) | Yes | Unique login email. |
| `full_name` | VARCHAR(150) | Yes | Admin display name. |
| `password_hash` | VARCHAR(255) | Yes | PBKDF2-SHA256 password hash. |
| `is_active` | BOOLEAN | Yes | Enables or disables login. |
| `last_login_at` | TIMESTAMP | No | Last successful login. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

### `gallery_images`

Use `gallery_images` to store public gallery photos and their hover captions.
Seed records point to bundled optimized WebP frontend images. Admin uploads are
converted to optimized WebP files under `uploads/gallery/` and save their public
URL on `image_url`.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `title` | VARCHAR(150) | Yes | Gallery title shown in the overlay. |
| `caption` | TEXT | Yes | Gallery caption shown in the overlay. |
| `image_url` | VARCHAR(500) | Yes | Public image URL. |
| `image_alt` | VARCHAR(250) | Yes | Accessible image alt text. |
| `original_filename` | VARCHAR(255) | No | Source filename for uploaded images. |
| `content_type` | VARCHAR(100) | No | Uploaded image MIME type. |
| `file_size` | INTEGER | No | Uploaded image size in bytes. |
| `sort_order` | SMALLINT | Yes | Display order. |
| `is_active` | BOOLEAN | Yes | Enables or disables the image in public pages. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

### `faqs`

Use `faqs` to store frequently asked questions shown on the public website or
recruitment pages.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `code` | VARCHAR(100) | Yes | Stable FAQ code for seed and updates. |
| `question` | TEXT | Yes | FAQ question. |
| `answer` | TEXT | Yes | FAQ answer. |
| `sort_order` | SMALLINT | Yes | Display order. |
| `is_active` | BOOLEAN | Yes | Enables or disables the FAQ in public pages. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

### FAQ Seed SQL

PostgreSQL seed example. This assumes `gen_random_uuid()` is available and a
unique constraint exists on `faqs.code`.

```sql
WITH faq_seed (code, question, answer, sort_order) AS (
  VALUES
    (
      'BUSINESS_FIELD',
      'Bergerak di bidang apa?',
      'Logistik, Trucking, Pergudangan, dan Distribusi FMCG.',
      1
    ),
    (
      'COMPANY_LOCATION',
      'Dimana lokasi perusahaan?',
      'Grand ITC Permata Hijau, Blok Sapphire No.19, Kebayoran Lama, Jakarta Selatan.',
      2
    ),
    (
      'OUTSOURCING_COMPANY',
      'Apakah ini perusahaan outsourcing?',
      'Bukan, kami bukan perusahaan outsourcing.',
      3
    ),
    (
      'COMPANY_CLIENTS',
      'Apa saja client perusahaan ini?',
      'Bervariasi, salah satunya: Danone (AQUA), Nutricia, Japfa, Heinz-ABC, Agriaku, Wings Group, Bukalapak, DHL, PT. Balina Agung Perkasa.',
      4
    ),
    (
      'PLACEMENT_LOCATIONS',
      'Lokasi di mana saja? Penempatan di mana saja?',
      'Kebanyakan di Jawa Barat dan Jakarta. Misalnya, Subang, Bandung, Parung, Ciherang, Sentul, Ciawi, Sunter Jakarta, Ciracas Jakarta, Cipinang - Jakarta, Permata Hijau - Jakarta - Tangerang. Penempatan disesuaikan kebutuhan yang ada.',
      5
    ),
    (
      'INTERVIEW_AFTER_WA_OR_PHONE',
      'Saya sudah mendapatkan pesan dari WA / Telepon, bagaimana untuk interviewnya?',
      'Lanjutkan ke daftar jadwal interview di WA anda. Setelah diisi, anda tinggal datang pada jadwal yang ditentukan.',
      6
    ),
    (
      'NO_EXPERIENCE_APPLY',
      'Apakah yang belum berpengalaman dapat mendaftar?',
      'Diutamakan yang sudah berpengalaman. Tapi yang belum berpengalaman, secara berkala kami juga buka posisi magang.',
      7
    ),
    (
      'INTERNSHIP_MEANING',
      'Apakah maksudnya magang?',
      'Artinya diberi kesempatan belajar dalam bekerja di dalam waktu terbatas, misalnya 3 bulan.',
      8
    ),
    (
      'ONLINE_INTERVIEW_OUT_OF_TOWN',
      'Saya di luar kota, bolehkah interview online?',
      'Mohon untuk telepon Admin HR kami.',
      9
    ),
    (
      'HOW_TO_APPLY',
      'Bagaimana cara mendaftar?',
      'Isi CV anda di https://bit.ly/kandidathgs, lalu lanjutkan untuk isi kapan anda dapat interview. Tunggu konfirmasi dari Admin HR kami.',
      10
    ),
    (
      'INTERVIEW_REQUIREMENTS',
      'Apa saja yang harus dipersiapkan?',
      'Untuk para Driver, SIM A, SIM B. Bila ada SIM B1 dan B2. Untuk Staff, KTP.',
      11
    ),
    (
      'AFTER_INTERVIEW_STATUS',
      'Setelah di interview, bagaimana saya mengetahui status lebih lanjut?',
      'Biasanya jawaban akan diberikan sebelum 2 minggu. Bila tidak ada jawaban lewat dari 2 minggu, artinya belum diterima. Atau telepon HR admin kami pada jam kerja.',
      12
    ),
    (
      'RECRUITMENT_FEE',
      'Apakah dikenai biaya?',
      'Sama sekali tidak! Mohon bila ada yang minta biaya, dapat diberitahukan kepada kami lewat WA atau telepon.',
      13
    ),
    (
      'COMPANY_ESTABLISHED',
      'Berdiri sejak kapan, Handal Guna Sarana?',
      'Berdiri sejak tahun 2012.',
      14
    ),
    (
      'CAREER_PATH',
      'Apakah pada jenjang karir ada peluang kedepannya atau tidak?',
      'Jenjang karir terbuka lebar untuk seluruh staff.',
      15
    ),
    (
      'BPJS_BENEFIT',
      'Apakah disediakan BPJS?',
      'Iya, kami menyediakan BPJS Kesehatan dan BPJS Ketenagakerjaan untuk seluruh staff.',
      16
    ),
    (
      'THR_BENEFIT',
      'Apakah ada tunjangan hari raya?',
      'Iya, kami menyediakan tunjangan hari raya untuk seluruh staff.',
      17
    )
)
INSERT INTO faqs (
  id,
  code,
  question,
  answer,
  sort_order,
  is_active,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  code,
  question,
  answer,
  sort_order,
  true,
  now(),
  now()
FROM faq_seed
ON CONFLICT (code) DO UPDATE SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();
```

## Master Data

Use `divisions` as the master table for numbered business divisions and
`positions` as the master table for jobs under each division.

### `divisions`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `code` | VARCHAR(50) | Yes | Stable code, for example `OPERATIONAL_TRANSPORT`. |
| `name` | VARCHAR(150) | Yes | Division display name. |
| `sort_order` | SMALLINT | Yes | Uses the division number from the source list. |
| `is_active` | BOOLEAN | Yes | Enables or disables the division in forms. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

### `positions`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `division_id` | UUID | Yes | Links to `divisions`. |
| `code` | VARCHAR(80) | Yes | Stable code, for example `DRIVER`. |
| `name` | VARCHAR(150) | Yes | Job position display name. |
| `sort_order` | SMALLINT | Yes | Preserves display order inside the division. |
| `is_active` | BOOLEAN | Yes | Enables or disables the position in forms. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

### Division and Position Seed Data

| Division No. | Division | Job Positions |
| --- | --- | --- |
| 1 | OPERATIONAL TRANSPORT | MT Transport/Logistic, SPV Transport, Koord. Transport, Dispatcher, Data Entry, Checker Plant, Driver, Helper |
| 2 | DIVISI HR GA | Chif Security, SPV GA, Field Recruiter, Staff HRD, Koord. GA, Security, Staff Umum, Drafter |
| 3 | DIVISI FINANCE | Purchasing, Cashier, MT Finance, Staff AR, Staff Accounting, Staff Pajak, Staff Payroll, Auditor Internal, Legal |
| 4 | DIVISI FLEET | SPV Fleet, Koord. Fleet, Mekanik Midle, Service Officer, Mekanik Junior, Mekanik Senior, Petroll Man, Tyre Man |
| 5 | DIVISI PROJECT | PIC Project, BD (Bussines Development) |
| 6 | DIVISI WAREHOUSE | SPV Gudang, Kepala Gudang, Leader Shift Gudang, Admin Gudang, Staff Gudang, Checker, Operator Forklip, Checker Gudang |
| 7 | DIVISI IT | SPV IT, Senior Programmer, Junior Programmer, IT Support |
| 8 | DIVISI RESTAURANT | Manager Resto, Waiter, Cook Helper, Staff Gudang Resto |
| 9 | DIVISI SALES | Admin Sales, Sales TO, SMD, SPV Sales, Mt Sales, OM (Operation Manager Sales), Design Grafis |

### Division and Position Seed SQL

PostgreSQL seed example. This assumes `gen_random_uuid()` is available and
unique constraints exist on `divisions.code` and `(positions.division_id, positions.code)`.

```sql
WITH division_seed (code, name, sort_order) AS (
  VALUES
    ('OPERATIONAL_TRANSPORT', 'OPERATIONAL TRANSPORT', 1),
    ('DIVISI_HR_GA', 'DIVISI HR GA', 2),
    ('DIVISI_FINANCE', 'DIVISI FINANCE', 3),
    ('DIVISI_FLEET', 'DIVISI FLEET', 4),
    ('DIVISI_PROJECT', 'DIVISI PROJECT', 5),
    ('DIVISI_WAREHOUSE', 'DIVISI WAREHOUSE', 6),
    ('DIVISI_IT', 'DIVISI IT', 7),
    ('DIVISI_RESTAURANT', 'DIVISI RESTAURANT', 8),
    ('DIVISI_SALES', 'DIVISI SALES', 9)
),
upserted_divisions AS (
  INSERT INTO divisions (
    id,
    code,
    name,
    sort_order,
    is_active,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    code,
    name,
    sort_order,
    true,
    now(),
    now()
  FROM division_seed
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active,
    updated_at = now()
  RETURNING id, code
),
all_divisions AS (
  SELECT id, code FROM upserted_divisions
  UNION
  SELECT id, code FROM divisions
  WHERE code IN (SELECT code FROM division_seed)
),
position_seed (division_code, code, name, sort_order) AS (
  VALUES
    ('OPERATIONAL_TRANSPORT', 'MT_TRANSPORT_LOGISTIC', 'MT Transport/Logistic', 1),
    ('OPERATIONAL_TRANSPORT', 'SPV_TRANSPORT', 'SPV Transport', 2),
    ('OPERATIONAL_TRANSPORT', 'KOORD_TRANSPORT', 'Koord. Transport', 3),
    ('OPERATIONAL_TRANSPORT', 'DISPATCHER', 'Dispatcher', 4),
    ('OPERATIONAL_TRANSPORT', 'DATA_ENTRY', 'Data Entry', 5),
    ('OPERATIONAL_TRANSPORT', 'CHECKER_PLANT', 'Checker Plant', 6),
    ('OPERATIONAL_TRANSPORT', 'DRIVER', 'Driver', 7),
    ('OPERATIONAL_TRANSPORT', 'HELPER', 'Helper', 8),
    ('DIVISI_HR_GA', 'CHIF_SECURITY', 'Chif Security', 1),
    ('DIVISI_HR_GA', 'SPV_GA', 'SPV GA', 2),
    ('DIVISI_HR_GA', 'FIELD_RECRUITER', 'Field Recruiter', 3),
    ('DIVISI_HR_GA', 'STAFF_HRD', 'Staff HRD', 4),
    ('DIVISI_HR_GA', 'KOORD_GA', 'Koord. GA', 5),
    ('DIVISI_HR_GA', 'SECURITY', 'Security', 6),
    ('DIVISI_HR_GA', 'STAFF_UMUM', 'Staff Umum', 7),
    ('DIVISI_HR_GA', 'DRAFTER', 'Drafter', 8),
    ('DIVISI_FINANCE', 'PURCHASING', 'Purchasing', 1),
    ('DIVISI_FINANCE', 'CASHIER', 'Cashier', 2),
    ('DIVISI_FINANCE', 'MT_FINANCE', 'MT Finance', 3),
    ('DIVISI_FINANCE', 'STAFF_AR', 'Staff AR', 4),
    ('DIVISI_FINANCE', 'STAFF_ACCOUNTING', 'Staff Accounting', 5),
    ('DIVISI_FINANCE', 'STAFF_PAJAK', 'Staff Pajak', 6),
    ('DIVISI_FINANCE', 'STAFF_PAYROLL', 'Staff Payroll', 7),
    ('DIVISI_FINANCE', 'AUDITOR_INTERNAL', 'Auditor Internal', 8),
    ('DIVISI_FINANCE', 'LEGAL', 'Legal', 9),
    ('DIVISI_FLEET', 'SPV_FLEET', 'SPV Fleet', 1),
    ('DIVISI_FLEET', 'KOORD_FLEET', 'Koord. Fleet', 2),
    ('DIVISI_FLEET', 'MEKANIK_MIDLE', 'Mekanik Midle', 3),
    ('DIVISI_FLEET', 'SERVICE_OFFICER', 'Service Officer', 4),
    ('DIVISI_FLEET', 'MEKANIK_JUNIOR', 'Mekanik Junior', 5),
    ('DIVISI_FLEET', 'MEKANIK_SENIOR', 'Mekanik Senior', 6),
    ('DIVISI_FLEET', 'PETROLL_MAN', 'Petroll Man', 7),
    ('DIVISI_FLEET', 'TYRE_MAN', 'Tyre Man', 8),
    ('DIVISI_PROJECT', 'PIC_PROJECT', 'PIC Project', 1),
    ('DIVISI_PROJECT', 'BD_BUSSINES_DEVELOPMENT', 'BD (Bussines Development)', 2),
    ('DIVISI_WAREHOUSE', 'SPV_GUDANG', 'SPV Gudang', 1),
    ('DIVISI_WAREHOUSE', 'KEPALA_GUDANG', 'Kepala Gudang', 2),
    ('DIVISI_WAREHOUSE', 'LEADER_SHIFT_GUDANG', 'Leader Shift Gudang', 3),
    ('DIVISI_WAREHOUSE', 'ADMIN_GUDANG', 'Admin Gudang', 4),
    ('DIVISI_WAREHOUSE', 'STAFF_GUDANG', 'Staff Gudang', 5),
    ('DIVISI_WAREHOUSE', 'CHECKER', 'Checker', 6),
    ('DIVISI_WAREHOUSE', 'OPERATOR_FORKLIP', 'Operator Forklip', 7),
    ('DIVISI_WAREHOUSE', 'CHECKER_GUDANG', 'Checker Gudang', 8),
    ('DIVISI_IT', 'SPV_IT', 'SPV IT', 1),
    ('DIVISI_IT', 'SENIOR_PROGRAMMER', 'Senior Programmer', 2),
    ('DIVISI_IT', 'JUNIOR_PROGRAMMER', 'Junior Programmer', 3),
    ('DIVISI_IT', 'IT_SUPPORT', 'IT Support', 4),
    ('DIVISI_RESTAURANT', 'MANAGER_RESTO', 'Manager Resto', 1),
    ('DIVISI_RESTAURANT', 'WAITER', 'Waiter', 2),
    ('DIVISI_RESTAURANT', 'COOK_HELPER', 'Cook Helper', 3),
    ('DIVISI_RESTAURANT', 'STAFF_GUDANG_RESTO', 'Staff Gudang Resto', 4),
    ('DIVISI_SALES', 'ADMIN_SALES', 'Admin Sales', 1),
    ('DIVISI_SALES', 'SALES_TO', 'Sales TO', 2),
    ('DIVISI_SALES', 'SMD', 'SMD', 3),
    ('DIVISI_SALES', 'SPV_SALES', 'SPV Sales', 4),
    ('DIVISI_SALES', 'MT_SALES', 'Mt Sales', 5),
    ('DIVISI_SALES', 'OM_OPERATION_MANAGER_SALES', 'OM (Operation Manager Sales)', 6),
    ('DIVISI_SALES', 'DESIGN_GRAFIS', 'Design Grafis', 7)
)
INSERT INTO positions (
  id,
  division_id,
  code,
  name,
  sort_order,
  is_active,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  d.id,
  p.code,
  p.name,
  p.sort_order,
  true,
  now(),
  now()
FROM position_seed p
JOIN all_divisions d ON d.code = p.division_code
ON CONFLICT (division_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();
```

## External Candidate Submission Fields

Store candidate submissions in `career_applications`. Use a separate
`career_application_work_experiences` table for repeatable work history entries.

### `career_applications`

#### Personal Information

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `career_job_id` | UUID | No | Links to `career_jobs` when the application is tied to a posted job. |
| `full_name` | VARCHAR(150) | Yes | Nama Lengkap. |
| `nickname` | VARCHAR(100) | Yes | Nama Panggilan. |
| `identity_number` | VARCHAR(32) | Yes | No. KTP. Store encrypted or masked where appropriate. |
| `identity_valid_until` | DATE | Yes | Masa Berlaku KTP. |
| `identity_address` | TEXT | Yes | Alamat KTP. |
| `domicile_address` | TEXT | Yes | Alamat Domisili. |
| `driving_license_number` | VARCHAR(32) | Yes | No. SIM. |
| `driving_license_class` | VARCHAR(20) | No | Golongan SIM. |
| `driving_license_valid_until` | DATE | Yes | Masa Berlaku SIM. |
| `birth_place` | VARCHAR(100) | Yes | Tempat lahir. |
| `birth_date` | DATE | Yes | Tanggal lahir. |
| `age` | SMALLINT | Yes | Umur at submission time. |
| `marital_status` | VARCHAR(50) | No | Status Pernikahan. |
| `gender` | VARCHAR(30) | No | Jenis Kelamin. |
| `mother_name` | VARCHAR(150) | Yes | Nama Ibu Kandung. Store encrypted or protected. |
| `religion` | VARCHAR(50) | No | Agama. |
| `phone_number` | VARCHAR(30) | Yes | No. HP. |
| `medical_history` | TEXT | No | Riwayat Penyakit. |
| `applied_at` | TIMESTAMP | Yes | Tanggal Melamar. |

#### Education

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `education_level` | VARCHAR(100) | No | Jenjang Pendidikan. |
| `school_name` | VARCHAR(150) | No | Nama Sekolah / Universitas. |
| `major` | VARCHAR(150) | No | Jurusan. |
| `school_entry_year` | SMALLINT | No | Tahun masuk sekolah / universitas. |
| `school_graduation_year` | SMALLINT | No | Tahun lulus sekolah / universitas. |
| `school_address` | TEXT | No | Alamat Sekolah / Universitas. |
| `grade_point_average` | VARCHAR(30) | No | Nilai rata-rata / IPK as entered by the candidate. |

#### Position Preference

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `applied_position` | VARCHAR(100) | Yes | Posisi Yang Dilamar, for example driver or helper. |
| `alternative_applied_position` | VARCHAR(100) | No | Alternatif posisi yang dilamar. |
| `vacancy_source` | VARCHAR(100) | Yes | Info Lowongan Dari. |
| `preferred_area` | VARCHAR(100) | No | Area Yang Diminati. |
| `willing_to_be_placed_anywhere` | BOOLEAN | Yes | Siap ditempatkan sesuai kebutuhan perusahaan. |
| `available_interview_date` | DATE | No | Bersedia interview kapan. |
| `interview_invitation_reason` | TEXT | Yes | Alasan kandidat layak diundang interview. |

#### Uploads

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `photo_file_id` | UUID | No | Links to `media_assets`; accepted formats: JPG or PNG, max 1 MB. |
| `resume_file_id` | UUID | No | Links to `media_assets`; accepted format: PDF, max 1 MB. |

#### Audit Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | VARCHAR(50) | Yes | Application workflow status, for example submitted, reviewed, shortlisted, rejected, or hired. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

### `career_application_social_media_accounts`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `career_application_id` | UUID | Yes | Links to `career_applications`. |
| `platform` | VARCHAR(50) | Yes | Social media platform selected by the candidate. |
| `account_id` | VARCHAR(150) | Yes | Candidate nickname / ID on the platform. |
| `sort_order` | SMALLINT | Yes | Preserves the order entered by the candidate. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

### `career_application_family_members`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `career_application_id` | UUID | Yes | Links to `career_applications`. |
| `relationship` | VARCHAR(50) | Yes | Hubungan keluarga. |
| `name` | VARCHAR(150) | Yes | Nama anggota keluarga. |
| `education_level` | VARCHAR(100) | No | Pendidikan terakhir anggota keluarga. |
| `occupation` | VARCHAR(150) | No | Pekerjaan anggota keluarga. |
| `workplace` | VARCHAR(150) | No | Tempat bekerja anggota keluarga. |
| `sort_order` | SMALLINT | Yes | Preserves the order entered by the candidate. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

### `career_application_organization_experiences`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `career_application_id` | UUID | Yes | Links to `career_applications`. |
| `organization_name` | VARCHAR(150) | Yes | Nama organisasi / pelatihan. |
| `position` | VARCHAR(100) | No | Jabatan or role. |
| `period` | VARCHAR(100) | No | Candidate-entered period. |
| `sort_order` | SMALLINT | Yes | Preserves the order entered by the candidate. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

### `career_application_work_experiences`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `career_application_id` | UUID | Yes | Links to `career_applications`. |
| `company_name` | VARCHAR(150) | Yes | Nama Perusahaan. |
| `position` | VARCHAR(100) | No | Posisi. |
| `employment_duration` | VARCHAR(100) | No | Lama Bekerja. |
| `salary` | DECIMAL(14,2) | No | Gaji. |
| `company_phone_number` | VARCHAR(30) | No | Nomor Telepon Perusahaan. |
| `leaving_reason` | TEXT | No | Alasan Keluar. |
| `company_comment` | TEXT | No | Komentar Tentang Perusahaan. |
| `sort_order` | SMALLINT | Yes | Preserves the order entered by the candidate. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |

## Internal Candidate Transfer Fields

Store employee transfer submissions in `internal_job_transfer_applications`.
This table supports internal candidates applying to move from one division,
position, or job assignment to another.

### `internal_job_transfer_applications`

#### Employee Information

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | UUID | Yes | Primary key. |
| `employee_id` | UUID | Yes | Links to `employees`; selected from Nama Lengkap. |
| `full_name` | VARCHAR(150) | Yes | Snapshot of employee full name at submission time. |
| `current_division_id` | UUID | No | Links to `divisions`; employee's current division. |
| `current_division_name` | VARCHAR(100) | No | Snapshot of current division. |
| `current_position_id` | UUID | No | Links to `positions`; Posisi Sekarang. |
| `current_position_name` | VARCHAR(100) | Yes | Snapshot of current position. |

#### Transfer Request

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `target_division_id` | UUID | No | Links to `divisions`; target division when known. |
| `target_division_name` | VARCHAR(100) | No | Snapshot of requested division. |
| `target_position_id` | UUID | No | Links to `positions`; Posisi Baru. |
| `target_position_name` | VARCHAR(100) | Yes | Requested new position. |
| `supervisor_name` | VARCHAR(150) | Yes | Nama atasan. |
| `transfer_reason` | TEXT | Yes | Catatan kenapa ingin pindah. |
| `positive_self_notes` | TEXT | Yes | Hal positive kandidat. |
| `additional_notes` | TEXT | Yes | Catatan lain; store "Tidak Ada" when empty if the form requires a value. |

#### Uploads

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `photo_file_id` | UUID | No | Links to `media_assets`; accepted formats: JPG or PNG, max 1 MB. |
| `resume_file_id` | UUID | No | Links to `media_assets`; accepted format: PDF, max 1 MB. |

#### Workflow

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | VARCHAR(50) | Yes | Transfer workflow status, for example submitted, manager_review, hr_review, approved, rejected, or transferred. |
| `submitted_at` | TIMESTAMP | Yes | Submission time. |
| `reviewed_by_user_id` | UUID | No | Links to `users`; reviewer or HR/admin user. |
| `reviewed_at` | TIMESTAMP | No | Review time. |
| `created_at` | TIMESTAMP | Yes | Record creation time. |
| `updated_at` | TIMESTAMP | Yes | Last update time. |
