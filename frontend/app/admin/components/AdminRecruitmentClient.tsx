"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AdminToast, type AdminToastState } from "./AdminToast";
import { adminClientRequest } from "../lib/client-api";
import { hasPermission } from "../lib/permissions";
import type {
  AdminUser,
  CareerApplicationAdmin,
  CareerApplicationCommentAdmin,
  CareerApplicationSummaryAdmin,
  CareerApplicationStatus,
} from "../lib/types";

type RecruitmentViewMode = "list" | "kanban";
type RecruitmentDetailTab =
  | "identity"
  | "cv"
  | "position"
  | "education"
  | "family"
  | "social"
  | "organization"
  | "work";

type RecruitmentColumn = {
  id: string;
  label: string;
  statuses: CareerApplicationStatus[];
};

const statusOptions: Array<{ label: string; value: CareerApplicationStatus }> = [
  { label: "New", value: "submitted" },
  { label: "Interview HR", value: "hr_interview" },
  { label: "Interview User", value: "user_interview" },
  { label: "Announcement", value: "offer" },
  { label: "Onboard", value: "onboard" },
  { label: "Rejected", value: "rejected" },
  { label: "Canceled", value: "canceled" },
];

const recruitmentColumns: RecruitmentColumn[] = [
  { id: "new", label: "New", statuses: ["submitted"] },
  { id: "interview-hr", label: "Interview HR", statuses: ["hr_interview"] },
  { id: "interview-user", label: "Interview User", statuses: ["user_interview"] },
  { id: "announcement", label: "Announcement", statuses: ["offer"] },
  { id: "done", label: "Done", statuses: ["onboard", "rejected", "canceled"] },
];

const detailTabs: Array<{ id: RecruitmentDetailTab; icon: string; label: string }> = [
  { id: "identity", icon: "user", label: "Identitas Kandidat" },
  { id: "position", icon: "briefcase", label: "Posisi yang Dilamar" },
  { id: "education", icon: "education", label: "Pendidikan terakhir" },
  { id: "family", icon: "family", label: "Riwayat Keluarga" },
  { id: "social", icon: "social", label: "Social Media" },
  { id: "organization", icon: "award", label: "Organisasi & Pelatihan" },
  { id: "work", icon: "building", label: "Riwayat Pekerjaan" },
  { id: "cv", icon: "file", label: "CV" },
];

const knownStatuses = new Set<string>(statusOptions.map((option) => option.value));

export function AdminRecruitmentClient({
  applications,
  currentUser,
}: {
  applications: CareerApplicationSummaryAdmin[];
  currentUser: AdminUser;
}) {
  const permissions = new Set(currentUser.role.permissions);
  const canReadRecruitment = hasPermission(permissions, "recruitment.read");
  const canUpdateRecruitment = hasPermission(permissions, "recruitment.update");
  const [applicationItems, setApplicationItems] = useState(applications);
  const [applicationDetailsById, setApplicationDetailsById] = useState<
    Record<string, CareerApplicationAdmin>
  >({});
  const [isLoadingApplicationDetail, setIsLoadingApplicationDetail] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<RecruitmentDetailTab>("position");
  const [toast, setToast] = useState<AdminToastState>(null);
  const [viewMode, setViewMode] = useState<RecruitmentViewMode>("kanban");

  const selectedApplication = useMemo(
    () => (selectedApplicationId ? applicationDetailsById[selectedApplicationId] : null),
    [applicationDetailsById, selectedApplicationId],
  );
  const selectedApplicationSummary = useMemo(
    () =>
      applicationItems.find((application) => application.id === selectedApplicationId) ??
      null,
    [applicationItems, selectedApplicationId],
  );

  const groupedApplications = useMemo(
    () =>
      recruitmentColumns.map((column) => ({
        ...column,
        applications: applicationItems.filter((application) => {
          if (column.statuses.includes(application.status as CareerApplicationStatus)) {
            return true;
          }
          return column.id === "new" && !knownStatuses.has(application.status);
        }),
      })),
    [applicationItems],
  );

  async function openApplicationPanel(application: CareerApplicationSummaryAdmin) {
    setSelectedApplicationId(application.id);
    setSelectedTab("position");
    if (applicationDetailsById[application.id]) {
      setIsLoadingApplicationDetail(false);
      return;
    }

    setIsLoadingApplicationDetail(true);
    try {
      const detail = await adminClientRequest<CareerApplicationAdmin>(
        `/api/intl/v1/recruitment/applications/${application.id}`,
      );
      setApplicationDetailsById((currentDetails) => ({
        ...currentDetails,
        [detail.id]: detail,
      }));
    } catch (error) {
      setSelectedApplicationId(null);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to load application detail.",
        tone: "error",
      });
    } finally {
      setIsLoadingApplicationDetail(false);
    }
  }

  function closeApplicationPanel() {
    setSelectedApplicationId(null);
  }

  function appendApplicationComment(
    applicationId: string,
    comment: CareerApplicationCommentAdmin,
  ) {
    setApplicationDetailsById((currentDetails) => {
      const application = currentDetails[applicationId];
      if (!application) {
        return currentDetails;
      }
      return {
        ...currentDetails,
        [applicationId]: {
          ...application,
          comments: [...application.comments, comment],
        },
      };
    });
  }

  function updateApplication(application: CareerApplicationAdmin) {
    setApplicationItems((currentItems) =>
      currentItems.map((currentApplication) =>
        currentApplication.id === application.id ? application : currentApplication,
      ),
    );
    setApplicationDetailsById((currentDetails) => ({
      ...currentDetails,
      [application.id]: application,
    }));
  }

  return (
    <div className={`admin-content-body admin-recruitment-body is-${viewMode}-view`}>
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">Human Resources</p>
          <h2>Recruitment</h2>
        </div>
        <div className="admin-topbar-actions">
          <span>{applicationItems.length} applications</span>
          <div className="admin-view-toggle" role="group" aria-label="Recruitment view">
            <button
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              className={viewMode === "list" ? "is-active" : undefined}
              onClick={() => setViewMode("list")}
              title="List view"
              type="button"
            >
              <ViewModeIcon name="list" />
            </button>
            <button
              aria-label="Kanban view"
              aria-pressed={viewMode === "kanban"}
              className={viewMode === "kanban" ? "is-active" : undefined}
              onClick={() => setViewMode("kanban")}
              title="Kanban view"
              type="button"
            >
              <ViewModeIcon name="kanban" />
            </button>
          </div>
        </div>
      </header>

      {canReadRecruitment ? (
        viewMode === "list" ? (
          <RecruitmentList applications={applicationItems} />
        ) : (
          <RecruitmentKanban
            columns={groupedApplications}
            onOpenApplication={openApplicationPanel}
          />
        )
      ) : (
        <p className="admin-notice">
          You do not have permission to view recruitment applications.
        </p>
      )}

      {selectedApplicationId ? (
        <RecruitmentDetailPanel
          application={selectedApplication}
          applicationSummary={selectedApplicationSummary}
          canComment={canUpdateRecruitment}
          isLoading={isLoadingApplicationDetail}
          onAppendComment={appendApplicationComment}
          onClose={closeApplicationPanel}
          onToast={setToast}
          onUpdateApplication={updateApplication}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      ) : null}

      <AdminToast onClose={() => setToast(null)} toast={toast} />
    </div>
  );
}

function RecruitmentList({
  applications,
}: {
  applications: CareerApplicationSummaryAdmin[];
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table admin-recruitment-table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Career</th>
            <th>Area</th>
            <th>Applied</th>
            <th>Status</th>
            <th>Files</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr key={application.id}>
              <td>
                <strong>{application.full_name}</strong>
                <small>{application.phone_number}</small>
              </td>
              <td>
                {careerTitle(application)}
                <small>{careerMeta(application)}</small>
              </td>
              <td>
                {application.preferred_area ?? "-"}
                <small>{application.vacancy_source}</small>
              </td>
              <td>
                {formatDate(application.applied_at)}
                {application.available_interview_date ? (
                  <small>{formatDate(application.available_interview_date)}</small>
                ) : null}
              </td>
              <td>
                <StatusBadge status={application.status} />
              </td>
              <td>
                <ApplicationFiles application={application} />
              </td>
            </tr>
          ))}
          {applications.length === 0 ? (
            <tr>
              <td colSpan={6}>No applications yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function RecruitmentKanban({
  columns,
  onOpenApplication,
}: {
  columns: Array<RecruitmentColumn & { applications: CareerApplicationSummaryAdmin[] }>;
  onOpenApplication: (application: CareerApplicationSummaryAdmin) => void;
}) {
  return (
    <section className="admin-recruitment-kanban" aria-label="Recruitment kanban">
      {columns.map((column) => (
        <article className="admin-recruitment-column" key={column.id}>
          <header>
            <h3>{column.label}</h3>
            <span>{column.applications.length}</span>
          </header>
          <div className="admin-recruitment-cards">
            {column.applications.map((application) => (
              <RecruitmentCard
                application={application}
                isCompact={column.id === "done"}
                key={application.id}
                onOpen={() => onOpenApplication(application)}
              />
            ))}
            {column.applications.length === 0 ? (
              <p className="admin-recruitment-empty">No applications</p>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  );
}

function RecruitmentCard({
  application,
  isCompact,
  onOpen,
}: {
  application: CareerApplicationSummaryAdmin;
  isCompact: boolean;
  onOpen: () => void;
}) {
  const cardTone = isCompact ? recruitmentDoneCardTone(application.status) : "";

  return (
    <button
      className={[
        "admin-recruitment-card",
        isCompact ? "is-compact" : "",
        cardTone,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onOpen}
      type="button"
    >
      <div>
        <strong>{application.full_name}</strong>
        <small>{application.phone_number}</small>
      </div>
      {isCompact ? null : (
        <>
          <p>{careerTitle(application)}</p>
          <dl>
            <div>
              <dt>Area</dt>
              <dd>{application.preferred_area ?? "-"}</dd>
            </div>
            <div>
              <dt>Applied</dt>
              <dd>{formatDate(application.applied_at)}</dd>
            </div>
          </dl>
        </>
      )}
    </button>
  );
}

function RecruitmentDetailPanel({
  application,
  applicationSummary,
  canComment,
  isLoading,
  onAppendComment,
  onClose,
  onToast,
  onUpdateApplication,
  selectedTab,
  setSelectedTab,
}: {
  application: CareerApplicationAdmin | null;
  applicationSummary: CareerApplicationSummaryAdmin | null;
  canComment: boolean;
  isLoading: boolean;
  onAppendComment: (
    applicationId: string,
    comment: CareerApplicationCommentAdmin,
  ) => void;
  onClose: () => void;
  onToast: (toast: AdminToastState) => void;
  onUpdateApplication: (application: CareerApplicationAdmin) => void;
  selectedTab: RecruitmentDetailTab;
  setSelectedTab: (tab: RecruitmentDetailTab) => void;
}) {
  const [commentDraft, setCommentDraft] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const headerApplication = application ?? applicationSummary;

  const statusActions = application ? recruitmentStatusActions(application.status) : [];

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanComment = commentDraft.trim();
    if (!application || !cleanComment || isSubmittingComment) {
      return;
    }

    setIsSubmittingComment(true);
    try {
      const createdComment = await adminClientRequest<CareerApplicationCommentAdmin>(
        `/api/intl/v1/recruitment/applications/${application.id}/comments`,
        {
          body: JSON.stringify({ comment: cleanComment }),
          method: "POST",
        },
      );
      onAppendComment(application.id, createdComment);
      setCommentDraft("");
      onToast({ message: "Comment added.", tone: "success" });
    } catch (error) {
      onToast({
        message: error instanceof Error ? error.message : "Failed to add comment.",
        tone: "error",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function updateStatus(nextStatus: CareerApplicationStatus) {
    if (!application || isUpdatingStatus) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const updatedApplication = await adminClientRequest<CareerApplicationAdmin>(
        `/api/intl/v1/recruitment/applications/${application.id}`,
        {
          body: JSON.stringify({ status: nextStatus }),
          method: "PATCH",
        },
      );
      const refreshedApplication = await adminClientRequest<CareerApplicationAdmin>(
        `/api/intl/v1/recruitment/applications/${updatedApplication.id}`,
      );
      onUpdateApplication(refreshedApplication);
      onToast({ message: "Status updated.", tone: "success" });
    } catch (error) {
      onToast({
        message: error instanceof Error ? error.message : "Failed to update status.",
        tone: "error",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div
      aria-labelledby="recruitment-detail-title"
      aria-modal="true"
      className="admin-recruitment-panel-backdrop"
      role="dialog"
    >
      <section className="admin-recruitment-panel">
        <main className="admin-recruitment-panel-main">
          <header className="admin-recruitment-panel-header">
            <div className="admin-recruitment-panel-title">
              <CandidatePhoto application={headerApplication} />
              <div>
                <p className="admin-kicker">
                  {headerApplication ? statusLabel(headerApplication.status) : "Loading"}
                </p>
                <h2 id="recruitment-detail-title">
                  {headerApplication?.full_name ?? "Loading candidate"}
                </h2>
                <span>
                  {headerApplication ? careerTitle(headerApplication) : "Loading detail"}
                </span>
              </div>
            </div>
            <div className="admin-recruitment-panel-actions">
              {statusActions.length > 0 ? (
                <details className="admin-recruitment-status-menu">
                  <summary>
                    <span>{isUpdatingStatus ? "Updating..." : "Update Status"}</span>
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <div>
                    {statusActions.map((action) => (
                      <button
                        disabled={isUpdatingStatus}
                        key={action.value}
                        onClick={() => updateStatus(action.value)}
                        type="button"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </details>
              ) : null}
              <button
                aria-label="Close candidate detail"
                className="admin-recruitment-panel-close"
                onClick={onClose}
                type="button"
              >
                Close
              </button>
            </div>
          </header>

          <nav className="admin-recruitment-detail-tabs" aria-label="Candidate detail tabs">
            {detailTabs.map((tab) => (
              <button
                aria-pressed={selectedTab === tab.id}
                aria-label={tab.label}
                className={selectedTab === tab.id ? "is-active" : undefined}
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                title={tab.label}
                type="button"
              >
                <TabIcon name={tab.icon} />
              </button>
            ))}
          </nav>

          <section className="admin-recruitment-detail-content">
            {application ? (
              <RecruitmentDetailTabContent application={application} tab={selectedTab} />
            ) : (
              <p className="admin-recruitment-detail-loading">
                {isLoading ? "Loading applicant detail..." : "Applicant detail unavailable."}
              </p>
            )}
          </section>
        </main>

        <aside className="admin-recruitment-comments">
          <header>
            <h3>Comments</h3>
            <span>{application?.comments.length ?? 0}</span>
          </header>
          <div className="admin-recruitment-comment-list">
            {application?.comments.map((comment) => (
              <article className="admin-recruitment-comment" key={comment.id}>
                <header>
                  <strong>{comment.author_name ?? "Deleted user"}</strong>
                  <time dateTime={comment.created_at}>
                    {formatDateTime(comment.created_at)}
                  </time>
                </header>
                <p>{comment.comment}</p>
              </article>
            ))}
            {application && application.comments.length === 0 ? (
              <p className="admin-recruitment-comments-empty">No comments yet.</p>
            ) : null}
            {!application ? (
              <p className="admin-recruitment-comments-empty">
                Comments load with applicant detail.
              </p>
            ) : null}
          </div>
          <form className="admin-recruitment-comment-form" onSubmit={submitComment}>
            <textarea
              disabled={!application || !canComment || isSubmittingComment}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder={
                canComment ? "Write a comment..." : "No permission to comment."
              }
              rows={4}
              value={commentDraft}
            />
            <button
              disabled={
                !application || !canComment || isSubmittingComment || !commentDraft.trim()
              }
              type="submit"
            >
              {isSubmittingComment ? "Saving..." : "Send Comment"}
            </button>
          </form>
        </aside>
      </section>
    </div>
  );
}

function CandidatePhoto({
  application,
}: {
  application: CareerApplicationSummaryAdmin | CareerApplicationAdmin | null;
}) {
  return (
    <div className="admin-recruitment-candidate-photo">
      {application?.self_photo_url ? (
        <img alt={`${application.full_name} photo`} src={application.self_photo_url} />
      ) : (
        <span>{application?.full_name.charAt(0).toUpperCase() ?? "?"}</span>
      )}
    </div>
  );
}

function ViewModeIcon({ name }: { name: "list" | "kanban" }) {
  if (name === "list") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M8 6h12" />
        <path d="M8 12h12" />
        <path d="M8 18h12" />
        <path d="M4 6h.01" />
        <path d="M4 12h.01" />
        <path d="M4 18h.01" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 5h5v14H4z" />
      <path d="M10.5 5h5v9h-5z" />
      <path d="M17 5h3v14h-3z" />
    </svg>
  );
}

function TabIcon({ name }: { name: string }) {
  if (name === "briefcase") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M10 7V5h4v2" />
        <path d="M5 7h14v12H5z" />
        <path d="M5 12h14" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    );
  }
  if (name === "file") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" />
        <path d="M9 14h6" />
        <path d="M9 17h4" />
      </svg>
    );
  }
  if (name === "education") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M3 8l9-4 9 4-9 4z" />
        <path d="M7 10v5c2.8 2 7.2 2 10 0v-5" />
      </svg>
    );
  }
  if (name === "family") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
        <path d="M3 21a5 5 0 0 1 10 0" />
        <path d="M14 21a4 4 0 0 1 7 0" />
      </svg>
    );
  }
  if (name === "social") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M7 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M17 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M17 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M9.5 10.5l5-3" />
        <path d="M9.5 13.5l5 4" />
      </svg>
    );
  }
  if (name === "award") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
        <path d="M9 14l-2 7 5-3 5 3-2-7" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 21V7l8-4 8 4v14" />
      <path d="M9 21v-7h6v7" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
    </svg>
  );
}

function RecruitmentDetailTabContent({
  application,
  tab,
}: {
  application: CareerApplicationAdmin;
  tab: RecruitmentDetailTab;
}) {
  if (tab === "position") {
    return (
      <DetailGrid
        items={[
          ["Posisi dilamar", application.applied_position],
          ["Alternatif posisi", application.alternative_applied_position],
          ["Job posting", application.job_title],
          ["Divisi", application.division_name],
          ["Position master", application.position_name],
          ["Lokasi job", application.job_location],
          ["Tipe pekerjaan", application.job_employment_type],
          ["Sumber lowongan", application.vacancy_source],
          ["Area diminati", application.preferred_area],
          [
            "Bersedia ditempatkan",
            application.willing_to_be_placed_anywhere ? "Ya" : "Tidak",
          ],
          ["Tanggal interview", formatMaybeDate(application.available_interview_date)],
          ["Alasan layak interview", application.interview_invitation_reason],
        ]}
      />
    );
  }

  if (tab === "identity") {
    return (
      <>
        <DetailGrid
          items={[
            ["Nama lengkap", application.full_name],
            ["Nama panggilan", application.nickname],
            ["No. HP", application.phone_number],
            ["Jenis kelamin", application.gender],
            ["Tempat lahir", application.birth_place],
            ["Tanggal lahir", formatMaybeDate(application.birth_date)],
            ["Umur", `${application.age}`],
            ["Status pernikahan", application.marital_status],
            ["Agama", application.religion],
            ["Nama ibu kandung", application.mother_name],
            ["No. KTP", application.identity_number],
            ["Masa berlaku KTP", formatMaybeDate(application.identity_valid_until)],
            ["No. SIM", application.driving_license_number],
            ["Golongan SIM", application.driving_license_class],
            [
              "Masa berlaku SIM",
              formatMaybeDate(application.driving_license_valid_until),
            ],
            ["Riwayat penyakit", application.medical_history],
          ]}
        />
        <DetailTextBlock label="Alamat KTP" value={application.identity_address} />
        <DetailTextBlock label="Alamat Domisili" value={application.domicile_address} />
      </>
    );
  }

  if (tab === "cv") {
    return <CandidateCvViewer application={application} />;
  }

  if (tab === "education") {
    return (
      <>
        <DetailGrid
          items={[
            ["Jenjang pendidikan", application.education_level],
            ["Nama sekolah / universitas", application.school_name],
            ["Jurusan", application.major],
            ["Tahun masuk", formatMaybeValue(application.school_entry_year)],
            ["Tahun lulus", formatMaybeValue(application.school_graduation_year)],
            ["Nilai rata-rata / IPK", application.grade_point_average],
          ]}
        />
        <DetailTextBlock
          label="Alamat sekolah / universitas"
          value={application.school_address}
        />
      </>
    );
  }

  if (tab === "family") {
    return (
      <DetailTable
        columns={["Hubungan", "Nama", "Pendidikan", "Pekerjaan", "Tempat kerja"]}
        emptyMessage="No family history submitted."
        rows={application.family_members.map((member) => [
          member.relationship,
          member.name,
          member.education_level,
          member.occupation,
          member.workplace,
        ])}
      />
    );
  }

  if (tab === "social") {
    return (
      <DetailTable
        columns={["Platform", "Account ID"]}
        emptyMessage="No social media accounts submitted."
        rows={application.social_media_accounts.map((account) => [
          account.platform,
          account.account_id,
        ])}
      />
    );
  }

  if (tab === "organization") {
    return (
      <DetailTable
        columns={["Organisasi / Pelatihan", "Jabatan", "Periode"]}
        emptyMessage="No organization or training history submitted."
        rows={application.organization_experiences.map((experience) => [
          experience.organization_name,
          experience.position,
          experience.period,
        ])}
      />
    );
  }

  return (
    <DetailTable
      columns={[
        "Perusahaan",
        "Posisi",
        "Lama bekerja",
        "Gaji",
        "Telepon",
        "Alasan keluar",
        "Komentar",
      ]}
      emptyMessage="No work history submitted."
      rows={application.work_experiences.map((experience) => [
        experience.company_name,
        experience.position,
        experience.employment_duration,
        formatMaybeValue(experience.salary),
        experience.company_phone_number,
        experience.leaving_reason,
        experience.company_comment,
      ])}
    />
  );
}

function DetailGrid({
  items,
}: {
  items: Array<[string, string | number | null | undefined]>;
}) {
  return (
    <dl className="admin-recruitment-detail-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{formatMaybeValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function DetailTextBlock({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="admin-recruitment-detail-text">
      <strong>{label}</strong>
      <p>{formatMaybeValue(value)}</p>
    </div>
  );
}

function CandidateCvViewer({ application }: { application: CareerApplicationAdmin }) {
  const [status, setStatus] = useState<"checking" | "ready" | "error">(
    application.cv_file_url ? "checking" : "error",
  );

  useEffect(() => {
    let isCurrent = true;
    if (!application.cv_file_url) {
      setStatus("error");
      return;
    }

    setStatus("checking");
    fetch(application.cv_file_url, { method: "HEAD" })
      .then((response) => {
        if (!isCurrent) {
          return;
        }
        setStatus(response.ok ? "ready" : "error");
      })
      .catch(() => {
        if (isCurrent) {
          setStatus("error");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [application.cv_file_url]);

  if (!application.cv_file_url) {
    return (
      <p className="admin-recruitment-cv-message">
        CV file was not uploaded for this applicant.
      </p>
    );
  }

  if (status === "checking") {
    return <p className="admin-recruitment-cv-message">Checking CV file...</p>;
  }

  if (status === "error") {
    return (
      <p className="admin-recruitment-cv-message is-error">
        CV file could not be found or loaded.
      </p>
    );
  }

  return (
    <div className="admin-recruitment-cv-viewer">
      <iframe src={application.cv_file_url} title={`${application.full_name} CV`} />
    </div>
  );
}

function DetailTable({
  columns,
  emptyMessage,
  rows,
}: {
  columns: string[];
  emptyMessage: string;
  rows: Array<Array<string | number | null | undefined>>;
}) {
  if (rows.length === 0) {
    return <p className="admin-recruitment-empty">{emptyMessage}</p>;
  }

  return (
    <div className="admin-recruitment-detail-table-wrap">
      <table className="admin-recruitment-detail-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`}>{formatMaybeValue(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className="admin-status-pill">{statusLabel(status)}</span>;
}

function ApplicationFiles({
  application,
}: {
  application: CareerApplicationSummaryAdmin | CareerApplicationAdmin;
}) {
  return (
    <div className="admin-recruitment-files">
      {application.self_photo_url ? (
        <a href={application.self_photo_url} rel="noreferrer" target="_blank">
          Photo
        </a>
      ) : null}
      {application.cv_file_url ? (
        <a href={application.cv_file_url} rel="noreferrer" target="_blank">
          CV
        </a>
      ) : null}
      {!application.self_photo_url && !application.cv_file_url ? <span>-</span> : null}
    </div>
  );
}

function careerTitle(
  application: CareerApplicationSummaryAdmin | CareerApplicationAdmin,
) {
  return application.job_title ?? application.applied_position;
}

function careerMeta(
  application: CareerApplicationSummaryAdmin | CareerApplicationAdmin,
) {
  const values = [
    application.division_name,
    application.position_name,
    application.job_location,
  ].filter(Boolean);
  return values.length > 0 ? values.join(" / ") : application.applied_position;
}

function statusLabel(status: string) {
  return (
    statusOptions.find((option) => option.value === status)?.label ??
    status.replaceAll("_", " ")
  );
}

function recruitmentStatusActions(status: string) {
  if (status === "submitted") {
    return [
      { label: "Interview HR", value: "hr_interview" as const },
      { label: "Rejected", value: "rejected" as const },
    ];
  }
  if (status === "hr_interview") {
    return [
      { label: "Interview User", value: "user_interview" as const },
      { label: "Rejected", value: "rejected" as const },
    ];
  }
  if (status === "user_interview") {
    return [
      { label: "Announcement", value: "offer" as const },
      { label: "Rejected", value: "rejected" as const },
    ];
  }
  if (status === "offer") {
    return [
      { label: "Canceled", value: "canceled" as const },
      { label: "Rejected", value: "rejected" as const },
      { label: "Onboard", value: "onboard" as const },
    ];
  }
  return [];
}

function recruitmentDoneCardTone(status: string) {
  if (status === "onboard") {
    return "is-onboard";
  }
  if (status === "rejected") {
    return "is-rejected";
  }
  if (status === "canceled") {
    return "is-canceled";
  }
  return "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMaybeDate(value: string | null | undefined) {
  return value ? formatDate(value) : "-";
}

function formatMaybeValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return `${value}`;
}
