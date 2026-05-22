"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const maxWorkExperiences = 5;

const identityValidOptions = [
  { value: "9999-12-31", label: "Seumur hidup" },
  { value: "", label: "Pilih tanggal berlaku" },
];

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

export default function CareerApplicationPage() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedJobSlug, setSelectedJobSlug] = useState("");
  const [appliedPosition, setAppliedPosition] = useState("");
  const [isPositionPickerOpen, setIsPositionPickerOpen] = useState(false);
  const [identityValidUntil, setIdentityValidUntil] = useState("9999-12-31");
  const [workExperienceCount, setWorkExperienceCount] = useState(1);
  const [captcha, setCaptcha] = useState<CaptchaChallenge>(initialCaptcha);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const groupedPositionOptions = useMemo(() => {
    const query = appliedPosition.trim().toLowerCase();

    return divisions
      .map((division) => ({
        ...division,
        positions: division.positions.filter((position) => position.name.toLowerCase().includes(query)),
      }))
      .filter((division) => division.positions.length > 0);
  }, [appliedPosition, divisions]);

  useEffect(() => {
    setCaptcha(createCaptcha());
  }, []);

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
          setJobs(jobsPayload.data);
          setDivisions(divisionsPayload.data);
        }
      } catch {
        if (isMounted) {
          setStatus({
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
      setIsPositionPickerOpen(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (Number(captchaAnswer) !== captcha.left + captcha.right) {
      setStatus({ type: "error", message: "Jawaban captcha belum sesuai. Silakan coba lagi." });
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
      setStatus({
        type: "error",
        message: "Nama perusahaan wajib diisi pada setiap pengalaman kerja yang ditambahkan.",
      });
      return;
    }

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
      applied_position: appliedPosition,
      vacancy_source: readString(formData, "vacancy_source"),
      preferred_area: readOptionalString(formData, "preferred_area"),
      willing_to_be_placed_anywhere: formData.get("willing_to_be_placed_anywhere") === "on",
      available_interview_date: readOptionalString(formData, "available_interview_date"),
      interview_invitation_reason: readString(formData, "interview_invitation_reason"),
      work_experiences: workExperiences,
    };

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/extl/v1/career-applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const responsePayload = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = responsePayload?.detail;
        const message = typeof detail === "string" ? detail : responsePayload?.message;
        throw new Error(message || "Application could not be submitted.");
      }

      setStatus({
        type: "success",
        message: "Lamaran berhasil dikirim. Tim HR HGS akan menghubungi Anda sesuai proses rekrutmen.",
      });
      formRef.current?.reset();
      setSelectedJobSlug("");
      setAppliedPosition("");
      setIdentityValidUntil("9999-12-31");
      setWorkExperienceCount(1);
      setCaptcha(createCaptcha());
      setCaptchaAnswer("");
    } catch (error) {
      setStatus({
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
      <header className="application-header">
        <a className="application-logo" href="/" aria-label="HGS home">
          <img src="/images/logo.webp" alt="HGS Simply to serve logo" width="1600" height="872" />
        </a>
        <a className="back-link" href="/">
          Back to Home
        </a>
      </header>

      <section className="application-hero">
        <p className="eyebrow">Career Application</p>
        <h1>Candidate Submission</h1>
        <p>Lengkapi data kandidat dengan benar. Proses rekrutmen HGS tidak dipungut biaya.</p>
      </section>

      <form className="application-form" ref={formRef} onSubmit={handleSubmit}>
        {status && (
          <div className={`form-status ${status.type}`} role="status">
            {status.message}
          </div>
        )}

        <section className="form-section">
          <div className="form-section-heading">
            <p className="eyebrow">Lowongan</p>
            <h2>Posisi yang dilamar</h2>
          </div>
          <div className="form-grid two-columns">
            <label>
              Lowongan tersedia
              <select value={selectedJobSlug} onChange={(event) => handleJobChange(event.target.value)}>
                <option value="">Lamaran umum</option>
                {jobs.map((job) => (
                  <option value={job.slug} key={job.slug}>
                    {job.title} - {job.location}
                  </option>
                ))}
              </select>
            </label>
            <div
              className="field position-field"
              onBlur={(event) => {
                const nextFocus = event.relatedTarget;

                if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
                  setIsPositionPickerOpen(false);
                }
              }}
            >
              <span className="field-label">Posisi dilamar</span>
              <div className="position-combobox">
                <input
                  aria-autocomplete="list"
                  aria-expanded={isPositionPickerOpen}
                  aria-controls="position-options"
                  name="applied_position"
                  value={appliedPosition}
                  onChange={(event) => {
                    setAppliedPosition(event.target.value);
                    setIsPositionPickerOpen(true);
                  }}
                  onFocus={() => setIsPositionPickerOpen(true)}
                  placeholder="Cari posisi..."
                  required
                />
                {isPositionPickerOpen && (
                  <div className="position-options" id="position-options" role="listbox">
                    {groupedPositionOptions.length > 0 ? (
                      groupedPositionOptions.map((division) => (
                        <div className="position-option-group" key={division.code}>
                          <p>{division.name}</p>
                          {division.positions.map((position) => (
                            <button
                              type="button"
                              role="option"
                              aria-selected={appliedPosition === position.name}
                              key={`${division.code}-${position.code}`}
                              onClick={() => {
                                setAppliedPosition(position.name);
                                setIsPositionPickerOpen(false);
                              }}
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
            <label>
              Sumber informasi lowongan
              <input name="vacancy_source" defaultValue="Website HGS" required />
            </label>
            <label>
              Area penempatan yang diinginkan
              <input name="preferred_area" placeholder="Jakarta, Bandung, Subang, dll." />
            </label>
          </div>
          <label className="checkbox-field">
            <input name="willing_to_be_placed_anywhere" type="checkbox" />
            <span>Bersedia ditempatkan di area sesuai kebutuhan perusahaan</span>
          </label>
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
              <select value={identityValidUntil} onChange={(event) => setIdentityValidUntil(event.target.value)}>
                {identityValidOptions.map((option) => (
                  <option value={option.value} key={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              <select name="gender">
                <option value="">Pilih</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </label>
            <label>
              Status pernikahan
              <select name="marital_status">
                <option value="">Pilih</option>
                <option value="Belum menikah">Belum menikah</option>
                <option value="Menikah">Menikah</option>
                <option value="Cerai">Cerai</option>
              </select>
            </label>
            <label>
              Nama ibu kandung
              <input name="mother_name" required />
            </label>
            <label>
              Agama
              <input name="religion" />
            </label>
            <label className="full-span">
              Alamat KTP
              <textarea name="identity_address" rows={3} required />
            </label>
            <label className="full-span">
              Alamat domisili
              <textarea name="domicile_address" rows={3} required />
            </label>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <p className="eyebrow">SIM & Pendidikan</p>
            <h2>Kelengkapan kandidat</h2>
          </div>
          <div className="form-grid two-columns">
            <label>
              Nomor SIM
              <input name="driving_license_number" required />
            </label>
            <label>
              Jenis SIM
              <select name="driving_license_class">
                <option value="">Pilih</option>
                <option value="A">A</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C">C</option>
              </select>
            </label>
            <label>
              Masa berlaku SIM
              <input name="driving_license_valid_until" type="date" required />
            </label>
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
            <label className="full-span">
              Riwayat penyakit
              <textarea name="medical_history" rows={3} placeholder="Isi '-' bila tidak ada." />
            </label>
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
