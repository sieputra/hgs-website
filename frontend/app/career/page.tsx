"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

type CareerJob = {
  slug: string;
  title: string;
  position_name: string;
  location: string;
  employment_type: string;
};

type Division = {
  code: string;
  name: string;
  positions: {
    code: string;
    name: string;
  }[];
};

type CaptchaChallenge = {
  left: number;
  right: number;
};

type SelectOption = {
  value: string;
  label: string;
};

type FormStatus = {
  type: "success" | "error";
  message: string;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const maxWorkExperiences = 5;
const maxOrganizationExperiences = 5;
const maxSocialMediaAccounts = 5;
const maxFamilyMembers = 6;
const maxSelfPhotoBytes = 2 * 1024 * 1024;
const maxCvBytes = 5 * 1024 * 1024;

const identityValidOptions = [
  { value: "9999-12-31", label: "Seumur hidup" },
  { value: "", label: "Pilih tanggal berlaku" },
];

const placementAreaOptions = ["Jakarta", "Bandung", "Bogor", "Subang", "Sukabumi"].map((area) => ({
  value: area,
  label: area,
}));

const vacancySourceOptions = [
  "Website HGS",
  "Instagram",
  "Facebook",
  "TikTok",
  "LinkedIn",
  "JobStreet",
  "Glints",
  "Kalibrr",
  "WhatsApp",
  "Referensi karyawan",
  "Walk-in interview",
  "Lainnya",
].map((source) => ({
  value: source,
  label: source,
}));

const fallbackCareerJobs: CareerJob[] = [
  {
    slug: "driver-operasional",
    title: "Driver Operasional",
    position_name: "Driver",
    location: "Jakarta, Tangerang, Jawa Barat",
    employment_type: "Full-time",
  },
  {
    slug: "helper-gudang",
    title: "Helper Gudang",
    position_name: "Staff Gudang",
    location: "Jabodetabek dan Jawa Barat",
    employment_type: "Full-time",
  },
  {
    slug: "staff-hrd",
    title: "Staff HRD",
    position_name: "Staff HRD",
    location: "Jakarta Selatan",
    employment_type: "Full-time",
  },
];

const genderOptions = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
];

const maritalStatusOptions = [
  { value: "Belum menikah", label: "Belum menikah" },
  { value: "Menikah", label: "Menikah" },
  { value: "Cerai", label: "Cerai" },
];

const drivingLicenseClassOptions = ["A", "B1", "B2", "C"].map((licenseClass) => ({
  value: licenseClass,
  label: licenseClass,
}));

const familyRelationshipOptions = ["Ayah", "Ibu", "Suami", "Istri", "Anak", "Saudara", "Wali", "Lainnya"].map(
  (relationship) => ({
    value: relationship,
    label: relationship,
  }),
);

const socialMediaOptions = ["Instagram", "Facebook", "TikTok", "X / Twitter", "LinkedIn", "YouTube", "Lainnya"].map(
  (platform) => ({
    value: platform,
    label: platform,
  }),
);

const initialCaptcha = {
  left: 1,
  right: 1,
};

function createCaptcha(): CaptchaChallenge {
  return {
    left: Math.floor(Math.random() * 8) + 2,
    right: Math.floor(Math.random() * 8) + 2,
  };
}

function readString(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function readOptionalString(formData: FormData, name: string) {
  const value = readString(formData, name);
  return value.length > 0 ? value : null;
}

function readFile(formData: FormData, name: string) {
  const file = formData.get(name);
  return file instanceof File && file.size > 0 ? file : null;
}

function SearchableSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  resetKey,
}: {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  required?: boolean;
  resetKey?: number;
}) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internalValue, setInternalValue] = useState("");
  const selectedValue = value ?? internalValue;
  const selectedLabel = options.find((option) => option.value === selectedValue)?.label ?? "";
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (value === undefined) {
      setInternalValue("");
    }
  }, [resetKey, value]);

  return (
    <div
      className="position-combobox"
      onBlur={(event) => {
        const nextFocus = event.relatedTarget;

        if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
          setIsOpen(false);
          setQuery("");
        }
      }}
    >
      {name && <input name={name} type="hidden" value={selectedValue} />}
      <input
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setIsOpen(true);
          setQuery("");
        }}
        placeholder={placeholder}
        required={required && selectedValue.length === 0}
        value={isOpen ? query : selectedLabel}
      />
      {isOpen && (
        <div className="position-options" id={listboxId} role="listbox">
          {filteredOptions.length > 0 ? (
            <div className="position-option-group">
              {filteredOptions.map((option) => (
                <button
                  aria-selected={selectedValue === option.value}
                  key={option.value || option.label}
                  onClick={() => {
                    if (onChange) {
                      onChange(option.value);
                    } else {
                      setInternalValue(option.value);
                    }
                    setIsOpen(false);
                    setQuery("");
                  }}
                  role="option"
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="position-empty">Tidak ada pilihan yang cocok.</p>
          )}
        </div>
      )}
    </div>
  );
}

function PositionPicker({
  label,
  name,
  value,
  onChange,
  divisions,
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  divisions: Division[];
  required?: boolean;
}) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const groupedOptions = useMemo(() => {
    const query = value.trim().toLowerCase();

    return divisions
      .map((division) => ({
        ...division,
        positions: division.positions.filter((position) => position.name.toLowerCase().includes(query)),
      }))
      .filter((division) => division.positions.length > 0);
  }, [divisions, value]);

  return (
    <div
      className="field position-field"
      onBlur={(event) => {
        const nextFocus = event.relatedTarget;

        if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
          setIsOpen(false);
        }
      }}
    >
      <span className="field-label">{label}</span>
      <div className="position-combobox">
        <input
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          name={name}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari posisi..."
          required={required}
          value={value}
        />
        {isOpen && (
          <div className="position-options" id={listboxId} role="listbox">
            {groupedOptions.length > 0 ? (
              groupedOptions.map((division) => (
                <div className="position-option-group" key={division.code}>
                  <p>{division.name}</p>
                  {division.positions.map((position) => (
                    <button
                      aria-selected={value === position.name}
                      key={`${division.code}-${position.code}`}
                      onClick={() => {
                        onChange(position.name);
                        setIsOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      {position.name}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <p className="position-empty">Tidak ada posisi yang cocok.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CareerApplicationPage() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedJobSlug, setSelectedJobSlug] = useState("");
  const [appliedPosition, setAppliedPosition] = useState("");
  const [alternativeAppliedPosition, setAlternativeAppliedPosition] = useState("");
  const [preferredArea, setPreferredArea] = useState("");
  const [vacancySource, setVacancySource] = useState("Website HGS");
  const [identityValidUntil, setIdentityValidUntil] = useState("9999-12-31");
  const [workExperienceCount, setWorkExperienceCount] = useState(1);
  const [organizationExperienceCount, setOrganizationExperienceCount] = useState(1);
  const [socialMediaAccountCount, setSocialMediaAccountCount] = useState(1);
  const [familyMemberCount, setFamilyMemberCount] = useState(1);
  const [captcha, setCaptcha] = useState<CaptchaChallenge>(initialCaptcha);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [toast, setToast] = useState<FormStatus | null>(null);

  useEffect(() => {
    setCaptcha(createCaptcha());
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 4600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const jobSlug = query.get("job");

    if (jobSlug) {
      setSelectedJobSlug(jobSlug);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadRecruitmentData() {
      try {
        const [jobsResponse, divisionsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/extl/v1/jobs`),
          fetch(`${API_BASE_URL}/api/extl/v1/divisions`),
        ]);

        if (!jobsResponse.ok || !divisionsResponse.ok) {
          throw new Error("Recruitment data could not be loaded.");
        }

        const [jobsPayload, divisionsPayload] = (await Promise.all([
          jobsResponse.json(),
          divisionsResponse.json(),
        ])) as [ApiEnvelope<CareerJob[]>, ApiEnvelope<Division[]>];

        if (isMounted) {
          setJobs(jobsPayload.data.length > 0 ? jobsPayload.data : fallbackCareerJobs);
          setDivisions(divisionsPayload.data);
        }
      } catch {
        if (isMounted) {
          setJobs(fallbackCareerJobs);
          showStatus({
            type: "error",
            message: "Daftar lowongan belum dapat dimuat. Form tetap bisa dikirim dengan posisi yang Anda isi.",
          });
        }
      }
    }

    loadRecruitmentData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const selectedJob = jobs.find((job) => job.slug === selectedJobSlug);

    if (selectedJob && !appliedPosition) {
      setAppliedPosition(selectedJob.position_name);
    }
  }, [appliedPosition, jobs, selectedJobSlug]);

  function handleJobChange(slug: string) {
    const selectedJob = jobs.find((job) => job.slug === slug);
    setSelectedJobSlug(slug);

    if (selectedJob) {
      setAppliedPosition(selectedJob.position_name);
    }
  }

  function showStatus(nextStatus: FormStatus) {
    setStatus(nextStatus);
    setToast(nextStatus);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setToast(null);

    if (isSubmitting) {
      return;
    }

    if (Number(captchaAnswer) !== captcha.left + captcha.right) {
      showStatus({ type: "error", message: "Jawaban captcha belum sesuai. Silakan coba lagi." });
      setCaptcha(createCaptcha());
      setCaptchaAnswer("");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const workExperiences = Array.from({ length: workExperienceCount }, (_, index) => {
      const prefix = `work_experiences.${index}`;
      const experience = {
        company_name: readString(formData, `${prefix}.company_name`),
        position: readOptionalString(formData, `${prefix}.position`),
        employment_duration: readOptionalString(formData, `${prefix}.employment_duration`),
        salary: readOptionalString(formData, `${prefix}.salary`),
        company_phone_number: readOptionalString(formData, `${prefix}.company_phone_number`),
        leaving_reason: readOptionalString(formData, `${prefix}.leaving_reason`),
        company_comment: readOptionalString(formData, `${prefix}.company_comment`),
      };
      const hasContent = Object.values(experience).some((value) => value !== null && value !== "");

      return hasContent ? experience : null;
    }).filter((experience): experience is NonNullable<typeof experience> => experience !== null);

    const missingCompanyName = workExperiences.some((experience) => experience.company_name.length === 0);

    if (missingCompanyName) {
      showStatus({
        type: "error",
        message: "Nama perusahaan wajib diisi pada setiap pengalaman kerja yang ditambahkan.",
      });
      return;
    }

    const socialMediaAccounts = Array.from({ length: socialMediaAccountCount }, (_, index) => {
      const prefix = `social_media_accounts.${index}`;
      const account = {
        platform: readString(formData, `${prefix}.platform`),
        account_id: readString(formData, `${prefix}.account_id`),
      };
      const hasContent = Object.values(account).some((value) => value !== "");

      return hasContent ? account : null;
    }).filter((account): account is NonNullable<typeof account> => account !== null);

    const hasIncompleteSocialAccount = socialMediaAccounts.some(
      (account) => account.platform.length === 0 || account.account_id.length === 0,
    );

    if (socialMediaAccounts.length === 0 || hasIncompleteSocialAccount) {
      showStatus({
        type: "error",
        message: "Isi minimal satu akun social media lengkap dengan platform dan Nickname / ID.",
      });
      return;
    }

    const familyMembers = Array.from({ length: familyMemberCount }, (_, index) => {
      const prefix = `family_members.${index}`;
      const member = {
        relationship: readString(formData, `${prefix}.relationship`),
        name: readString(formData, `${prefix}.name`),
        education_level: readOptionalString(formData, `${prefix}.education_level`),
        occupation: readOptionalString(formData, `${prefix}.occupation`),
        workplace: readOptionalString(formData, `${prefix}.workplace`),
      };
      const hasContent = Object.values(member).some((value) => value !== null && value !== "");

      return hasContent ? member : null;
    }).filter((member): member is NonNullable<typeof member> => member !== null);

    const hasIncompleteFamilyMember = familyMembers.some(
      (member) => member.relationship.length === 0 || member.name.length === 0,
    );

    if (familyMembers.length === 0 || hasIncompleteFamilyMember) {
      showStatus({
        type: "error",
        message: "Isi minimal satu riwayat keluarga lengkap dengan hubungan dan nama.",
      });
      return;
    }

    const organizationExperiences = Array.from({ length: organizationExperienceCount }, (_, index) => {
      const prefix = `organization_experiences.${index}`;
      const experience = {
        organization_name: readString(formData, `${prefix}.organization_name`),
        position: readOptionalString(formData, `${prefix}.position`),
        period: readOptionalString(formData, `${prefix}.period`),
      };
      const hasContent = Object.values(experience).some((value) => value !== null && value !== "");

      return hasContent ? experience : null;
    }).filter((experience): experience is NonNullable<typeof experience> => experience !== null);

    const payload = {
      career_job_slug: selectedJobSlug || null,
      full_name: readString(formData, "full_name"),
      nickname: readString(formData, "nickname"),
      identity_number: readString(formData, "identity_number"),
      identity_valid_until: readString(formData, "identity_valid_until"),
      identity_address: readString(formData, "identity_address"),
      domicile_address: readString(formData, "domicile_address"),
      driving_license_number: readString(formData, "driving_license_number"),
      driving_license_class: readOptionalString(formData, "driving_license_class"),
      driving_license_valid_until: readString(formData, "driving_license_valid_until"),
      birth_place: readString(formData, "birth_place"),
      birth_date: readString(formData, "birth_date"),
      age: Number(readString(formData, "age")),
      marital_status: readOptionalString(formData, "marital_status"),
      gender: readOptionalString(formData, "gender"),
      mother_name: readString(formData, "mother_name"),
      religion: readOptionalString(formData, "religion"),
      phone_number: readString(formData, "phone_number"),
      medical_history: readOptionalString(formData, "medical_history"),
      education_level: readOptionalString(formData, "education_level"),
      school_name: readOptionalString(formData, "school_name"),
      major: readOptionalString(formData, "major"),
      school_entry_year: readOptionalString(formData, "school_entry_year"),
      school_graduation_year: readOptionalString(formData, "school_graduation_year"),
      school_address: readOptionalString(formData, "school_address"),
      grade_point_average: readOptionalString(formData, "grade_point_average"),
      applied_position: appliedPosition,
      alternative_applied_position: readOptionalString(formData, "alternative_applied_position"),
      vacancy_source: vacancySource,
      preferred_area: preferredArea || null,
      willing_to_be_placed_anywhere: formData.get("willing_to_be_placed_anywhere") === "on",
      available_interview_date: readOptionalString(formData, "available_interview_date"),
      interview_invitation_reason: readString(formData, "interview_invitation_reason"),
      social_media_accounts: socialMediaAccounts,
      family_members: familyMembers,
      organization_experiences: organizationExperiences,
      work_experiences: workExperiences,
    };

    const selfPhoto = readFile(formData, "self_photo");
    const cvFile = readFile(formData, "cv_file");

    if (!selfPhoto) {
      showStatus({ type: "error", message: "Upload foto diri wajib diisi." });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(selfPhoto.type)) {
      showStatus({ type: "error", message: "Foto diri harus berformat JPG, PNG, atau WebP." });
      return;
    }

    if (selfPhoto.size > maxSelfPhotoBytes) {
      showStatus({ type: "error", message: "Ukuran foto diri maksimal 2 MB." });
      return;
    }

    if (!cvFile) {
      showStatus({ type: "error", message: "Upload CV PDF wajib diisi." });
      return;
    }

    if (cvFile.type !== "application/pdf") {
      showStatus({ type: "error", message: "CV harus berformat PDF." });
      return;
    }

    if (cvFile.size > maxCvBytes) {
      showStatus({ type: "error", message: "Ukuran CV maksimal 5 MB." });
      return;
    }

    const submissionData = new FormData();
    submissionData.append("payload", JSON.stringify(payload));
    submissionData.append("self_photo", selfPhoto);
    submissionData.append("cv_file", cvFile);

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/extl/v1/career-applications`, {
        method: "POST",
        body: submissionData,
      });
      const responsePayload = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = responsePayload?.detail;
        const message = typeof detail === "string" ? detail : responsePayload?.message;
        throw new Error(message || "Application could not be submitted.");
      }

      showStatus({
        type: "success",
        message: "Lamaran berhasil dikirim. Tim HR HGS akan menghubungi Anda sesuai proses rekrutmen.",
      });
      formRef.current?.reset();
      setSelectedJobSlug("");
      setAppliedPosition("");
      setAlternativeAppliedPosition("");
      setPreferredArea("");
      setVacancySource("Website HGS");
      setIdentityValidUntil("9999-12-31");
      setWorkExperienceCount(1);
      setOrganizationExperienceCount(1);
      setSocialMediaAccountCount(1);
      setFamilyMemberCount(1);
      setFormResetKey((key) => key + 1);
      setCaptcha(createCaptcha());
      setCaptchaAnswer("");
    } catch (error) {
      showStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Lamaran belum berhasil dikirim. Silakan coba lagi.",
      });
      setCaptcha(createCaptcha());
      setCaptchaAnswer("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="application-page">
      {toast && (
        <div className="application-toast-region" role="status" aria-live="polite">
          <div className={`application-toast ${toast.type}`}>
            <p>{toast.message}</p>
            <button aria-label="Tutup notifikasi" onClick={() => setToast(null)} type="button">
              <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                <path d="M7 7l10 10" />
                <path d="M17 7L7 17" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div className="application-submit-overlay" role="status" aria-live="assertive">
          <div className="application-submit-progress" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p>Mengirim lamaran...</p>
        </div>
      )}

      <header className="application-header">
        <a className="application-logo" href="/" aria-label="HGS home">
          <img src="/images/logo.webp" alt="HGS Simply to serve logo" width="1600" height="872" />
        </a>
        <a className="back-link" href="/">
          Back to Home
        </a>
      </header>

      <section className="application-hero">
        <div className="application-hero-layout">
          <ol className="application-steps" aria-label="Recruitment steps">
            <li>
              <span>1</span>
              <p>Candidate Submission</p>
            </li>
            <li>
              <span>2</span>
              <p>HR Interview</p>
            </li>
            <li>
              <span>3</span>
              <p>User Interview</p>
            </li>
            <li>
              <span>4</span>
              <p>Announcement</p>
            </li>
          </ol>
          <div className="application-hero-copy">
            <p className="eyebrow">Career Application</p>
            <h1>Candidate Submission</h1>
            <p>Lengkapi data kandidat dengan benar. Proses rekrutmen HGS tidak dipungut biaya.</p>
          </div>
        </div>
        <a className="hero-next-link" href="#application-details" aria-label="Go to application form">
          <span aria-hidden="true" />
        </a>
      </section>

      <form aria-busy={isSubmitting} className="application-form" ref={formRef} onSubmit={handleSubmit}>
        {status && (
          <div className={`form-status ${status.type}`} role="status">
            {status.message}
          </div>
        )}

        <section className="form-section" id="application-details">
          <div className="form-section-heading">
            <p className="eyebrow">Lowongan</p>
            <h2>Posisi yang dilamar</h2>
          </div>
          <div className="form-grid two-columns">
            <label>
              Lowongan tersedia
              <SearchableSelect
                onChange={handleJobChange}
                options={[
                  { value: "", label: "Lamaran umum" },
                  ...jobs.map((job) => ({
                    value: job.slug,
                    label: `${job.title}`,
                  })),
                ]}
                placeholder="Cari lowongan..."
                value={selectedJobSlug}
              />
            </label>
            <PositionPicker
              divisions={divisions}
              label="Posisi dilamar"
              name="applied_position"
              onChange={setAppliedPosition}
              required
              value={appliedPosition}
            />
            <PositionPicker
              divisions={divisions}
              label="Alternatif Posisi dilamar"
              name="alternative_applied_position"
              onChange={setAlternativeAppliedPosition}
              value={alternativeAppliedPosition}
            />
            <label>
              Sumber informasi lowongan
              <SearchableSelect
                name="vacancy_source"
                onChange={setVacancySource}
                options={vacancySourceOptions}
                placeholder="Cari sumber informasi..."
                required
                value={vacancySource}
              />
            </label>
            <label>
              Area penempatan yang diinginkan
              <SearchableSelect
                name="preferred_area"
                onChange={setPreferredArea}
                options={placementAreaOptions}
                placeholder="Cari area..."
                value={preferredArea}
              />
            </label>
            <label className="checkbox-field">
              <span>
                <input name="willing_to_be_placed_anywhere" type="checkbox" />
                Bersedia ditempatkan di area sesuai kebutuhan perusahaan
              </span>
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <p className="eyebrow">Data Diri</p>
            <h2>Identitas kandidat</h2>
          </div>
          <div className="form-grid two-columns">
            <label>
              Nama lengkap
              <input name="full_name" autoComplete="name" required />
            </label>
            <label>
              Nama panggilan
              <input name="nickname" required />
            </label>
            <label>
              Nomor KTP
              <input name="identity_number" inputMode="numeric" required />
            </label>
            <label>
              Masa berlaku KTP
              <SearchableSelect
                onChange={setIdentityValidUntil}
                options={identityValidOptions}
                placeholder="Pilih masa berlaku KTP..."
                value={identityValidUntil}
              />
              {identityValidUntil !== "9999-12-31" && (
                <input
                  className="stacked-input"
                  name="identity_valid_until"
                  type="date"
                  value={identityValidUntil}
                  onChange={(event) => setIdentityValidUntil(event.target.value)}
                  required
                />
              )}
              {identityValidUntil === "9999-12-31" && (
                <input name="identity_valid_until" type="hidden" value={identityValidUntil} />
              )}
            </label>
            <label>
              Tempat lahir
              <input name="birth_place" required />
            </label>
            <label>
              Tanggal lahir
              <input name="birth_date" type="date" required />
            </label>
            <label>
              Usia
              <input name="age" type="number" min="15" max="80" required />
            </label>
            <label>
              Nomor telepon / WhatsApp
              <input name="phone_number" autoComplete="tel" required />
            </label>
            <label>
              Jenis kelamin
              <SearchableSelect
                name="gender"
                options={genderOptions}
                placeholder="Pilih jenis kelamin..."
                resetKey={formResetKey}
              />
            </label>
            <label>
              Status pernikahan
              <SearchableSelect
                name="marital_status"
                options={maritalStatusOptions}
                placeholder="Pilih status pernikahan..."
                resetKey={formResetKey}
              />
            </label>
            <label>
              Nama ibu kandung
              <input name="mother_name" required />
            </label>
            <label>
              Agama
              <input name="religion" />
            </label>
            <label>
              Nomor SIM
              <input name="driving_license_number" required />
            </label>
            <label>
              Jenis SIM
              <SearchableSelect
                name="driving_license_class"
                options={drivingLicenseClassOptions}
                placeholder="Pilih jenis SIM..."
                resetKey={formResetKey}
              />
            </label>
            <label>
              Masa berlaku SIM
              <input name="driving_license_valid_until" type="date" required />
            </label>
            <label className="full-span">
              Alamat KTP
              <textarea name="identity_address" rows={3} required />
            </label>
            <label className="full-span">
              Alamat domisili
              <textarea name="domicile_address" rows={3} required />
            </label>
            <label className="full-span">
              Riwayat penyakit
              <textarea name="medical_history" rows={3} placeholder="Isi '-' bila tidak ada." />
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <p className="eyebrow">Riwayat Keluarga</p>
            <h2>Riwayat keluarga</h2>
          </div>
          {Array.from({ length: familyMemberCount }, (_, index) => (
            <fieldset className="work-experience" key={index}>
              <legend>Keluarga {index + 1}</legend>
              <div className="form-grid two-columns">
                <label>
                  Hubungan
                  <SearchableSelect
                    name={`family_members.${index}.relationship`}
                    options={familyRelationshipOptions}
                    placeholder="-- pilih hubungan --"
                    resetKey={formResetKey}
                  />
                  <span className="field-hint"> {index === 0 && <em className="required-note">Isi Minimal Satu</em>}</span>
                </label>
                <label>
                  Nama
                  <input name={`family_members.${index}.name`} />
                  <span className="field-hint">isi nama keluarga terkait</span>
                </label>
                <label>
                  Pendidikan Terakhir
                  <input name={`family_members.${index}.education_level`} />
                  <span className="field-hint">pendidikan keluarga terkait</span>
                </label>
                <label>
                  Pekerjaan
                  <input name={`family_members.${index}.occupation`} />
                  <span className="field-hint">pekerjaan keluarga terkait</span>
                </label>
                <label>
                  Tempat Bekerja
                  <input name={`family_members.${index}.workplace`} />
                  <span className="field-hint">tempat bekerja keluarga terkait</span>
                </label>
              </div>
            </fieldset>
          ))}
          <div className="form-actions inline-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setFamilyMemberCount((count) => Math.min(count + 1, maxFamilyMembers))}
              disabled={familyMemberCount >= maxFamilyMembers}
            >
              Tambah keluarga
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setFamilyMemberCount((count) => Math.max(count - 1, 1))}
              disabled={familyMemberCount <= 1}
            >
              Hapus terakhir
            </button>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <p className="eyebrow">Social Media</p>
            <h2>Social Media</h2>
          </div>
          {Array.from({ length: socialMediaAccountCount }, (_, index) => (
            <fieldset className="work-experience" key={index}>
              <legend>Akun social media {index + 1}</legend>
              <div className="form-grid two-columns">
                <label>
                  Social Media 
                  <SearchableSelect
                    name={`social_media_accounts.${index}.platform`}
                    options={socialMediaOptions}
                    placeholder="-- pilih sosial media--"
                    resetKey={formResetKey}
                  />
                  <span className="field-hint">{index === 0 && <em className="required-note">* Isi Minimal Satu Akun</em>}</span>
                </label>
                <label>
                  Nickname / ID
                  <input name={`social_media_accounts.${index}.account_id`} />
                  <span className="field-hint">isi dengan id atau nama social media anda</span>
                </label>
              </div>
            </fieldset>
          ))}
          <div className="form-actions inline-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setSocialMediaAccountCount((count) => Math.min(count + 1, maxSocialMediaAccounts))}
              disabled={socialMediaAccountCount >= maxSocialMediaAccounts}
            >
              Tambah social media
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setSocialMediaAccountCount((count) => Math.max(count - 1, 1))}
              disabled={socialMediaAccountCount <= 1}
            >
              Hapus terakhir
            </button>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <p className="eyebrow">Pendidikan</p>
            <h2>Pendidikan terakhir kandidat</h2>
          </div>
          <div className="form-grid two-columns">
            <label>
              Pendidikan terakhir
              <input name="education_level" placeholder="SMA, SMK, D3, S1, dll." />
            </label>
            <label>
              Nama sekolah
              <input name="school_name" />
            </label>
            <label>
              Jurusan
              <input name="major" />
            </label>
            <label>
              Tahun Masuk
              <input name="school_entry_year" type="number" min="1950" max="2100" inputMode="numeric" />
            </label>
            <label>
              Tahun Lulus
              <input name="school_graduation_year" type="number" min="1950" max="2100" inputMode="numeric" />
            </label>
            <label>
              Nilai Rata-Rata / IPK
              <input name="grade_point_average" placeholder="8.5 / 3.25" />
            </label>
            <label className="full-span">
              Alamat Sekolah / Universitas
              <textarea name="school_address" rows={3} />
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <p className="eyebrow">Pengalaman Organisasi</p>
            <h2>Organisasi dan pelatihan</h2>
          </div>
          {Array.from({ length: organizationExperienceCount }, (_, index) => (
            <fieldset className="work-experience" key={index}>
              <legend>Pengalaman organisasi {index + 1}</legend>
              <div className="form-grid two-columns">
                <label>
                  Nama Organisasi / Pelatihan
                  <input name={`organization_experiences.${index}.organization_name`} />
                </label>
                <label>
                  Jabatan
                  <input name={`organization_experiences.${index}.position`} />
                </label>
                <label>
                  Periode
                  <input name={`organization_experiences.${index}.period`} />
                </label>
              </div>
            </fieldset>
          ))}
          <div className="form-actions inline-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setOrganizationExperienceCount((count) => Math.min(count + 1, maxOrganizationExperiences))}
              disabled={organizationExperienceCount >= maxOrganizationExperiences}
            >
              Tambah organisasi
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setOrganizationExperienceCount((count) => Math.max(count - 1, 1))}
              disabled={organizationExperienceCount <= 1}
            >
              Hapus terakhir
            </button>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <p className="eyebrow">Pengalaman</p>
            <h2>Riwayat pekerjaan</h2>
          </div>
          {Array.from({ length: workExperienceCount }, (_, index) => (
            <fieldset className="work-experience" key={index}>
              <legend>Pengalaman kerja {index + 1}</legend>
              <div className="form-grid two-columns">
                <label>
                  Nama perusahaan
                  <input name={`work_experiences.${index}.company_name`} />
                </label>
                <label>
                  Posisi
                  <input name={`work_experiences.${index}.position`} />
                </label>
                <label>
                  Lama bekerja
                  <input name={`work_experiences.${index}.employment_duration`} placeholder="2 tahun" />
                </label>
                <label>
                  Gaji terakhir
                  <input name={`work_experiences.${index}.salary`} inputMode="decimal" min="0" type="number" />
                </label>
                <label>
                  Telepon perusahaan
                  <input name={`work_experiences.${index}.company_phone_number`} />
                </label>
                <label>
                  Alasan keluar
                  <input name={`work_experiences.${index}.leaving_reason`} />
                </label>
                <label className="full-span">
                  Catatan perusahaan
                  <textarea name={`work_experiences.${index}.company_comment`} rows={3} />
                </label>
              </div>
            </fieldset>
          ))}
          <div className="form-actions inline-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setWorkExperienceCount((count) => Math.min(count + 1, maxWorkExperiences))}
              disabled={workExperienceCount >= maxWorkExperiences}
            >
              Tambah pengalaman
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setWorkExperienceCount((count) => Math.max(count - 1, 1))}
              disabled={workExperienceCount <= 1}
            >
              Hapus terakhir
            </button>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <p className="eyebrow">Dokumen</p>
            <h2>Upload kandidat</h2>
          </div>
          <div className="form-grid two-columns">
            <label>
              Foto diri
              <input accept="image/jpeg,image/png,image/webp" name="self_photo" required type="file" />
              <span className="field-hint">Format JPG, PNG, atau WebP. Maksimal 2 MB.</span>
            </label>
            <label>
              CV PDF
              <input accept="application/pdf" name="cv_file" required type="file" />
              <span className="field-hint">Upload CV dalam format PDF. Maksimal 5 MB.</span>
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <p className="eyebrow">Interview</p>
            <h2>Kesiapan proses</h2>
          </div>
          <div className="form-grid two-columns">
            <label>
              Tanggal interview yang tersedia
              <input name="available_interview_date" type="date" />
            </label>
            <label>
              Captcha: {captcha.left} + {captcha.right}
              <input
                value={captchaAnswer}
                onChange={(event) => setCaptchaAnswer(event.target.value)}
                inputMode="numeric"
                required
              />
            </label>
            <label className="full-span">
              Alasan ingin mengikuti interview
              <textarea name="interview_invitation_reason" rows={4} required />
            </label>
          </div>
          <div className="form-actions">
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}
