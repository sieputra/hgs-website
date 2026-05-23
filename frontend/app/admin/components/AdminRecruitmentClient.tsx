"use client";

import { type DragEvent, type FormEvent, useEffect, useMemo, useState } from "react";

import { AdminToast, type AdminToastState } from "./AdminToast";
import { ViewActionIcon } from "./AdminActionIcons";
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
type RecruitmentListFilters = {
  area: string;
  appliedFrom: string;
  appliedTo: string;
  candidateName: string;
  jobPosition: string;
  phone: string;
  status: string;
};
type RecruitmentPhotoPreview = {
  name: string;
  url: string;
};
type RecruitmentDetailTab =
  | "ai"
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
  { id: "ai", icon: "ai", label: "AI" },
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
  const [movingApplicationId, setMovingApplicationId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<RecruitmentPhotoPreview | null>(null);

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

  function openPhotoPreview(
    application: CareerApplicationSummaryAdmin | CareerApplicationAdmin,
  ) {
    if (!application.self_photo_url) {
      return;
    }
    setPhotoPreview({
      name: application.full_name,
      url: application.self_photo_url,
    });
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

  async function moveApplicationStatus(
    application: CareerApplicationSummaryAdmin,
    nextStatus: CareerApplicationStatus,
  ) {
    if (!canUpdateRecruitment || movingApplicationId) {
      return;
    }
    if (application.status === nextStatus) {
      return;
    }
    if (!canMoveApplicationToStatus(application.status, nextStatus)) {
      setToast({
        message: "This status move is not allowed by the recruitment workflow.",
        tone: "error",
      });
      return;
    }

    setMovingApplicationId(application.id);
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
      updateApplication(refreshedApplication);
      setToast({
        message: `Moved to ${statusLabel(nextStatus)} and comment added.`,
        tone: "success",
      });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to move application.",
        tone: "error",
      });
    } finally {
      setMovingApplicationId(null);
    }
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
          <RecruitmentList
            applications={applicationItems}
            onOpenApplication={openApplicationPanel}
            onPreviewPhoto={openPhotoPreview}
          />
        ) : (
          <RecruitmentKanban
            canMoveApplications={canUpdateRecruitment}
            columns={groupedApplications}
            movingApplicationId={movingApplicationId}
            onMoveApplication={moveApplicationStatus}
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
          onPreviewPhoto={openPhotoPreview}
          photoPreview={photoPreview}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
        />
      ) : null}

      {photoPreview ? (
        <PhotoPreviewDialog
          photo={photoPreview}
          onClose={() => setPhotoPreview(null)}
        />
      ) : null}

      <AdminToast onClose={() => setToast(null)} toast={toast} />
    </div>
  );
}

function RecruitmentList({
  applications,
  onOpenApplication,
  onPreviewPhoto,
}: {
  applications: CareerApplicationSummaryAdmin[];
  onOpenApplication: (application: CareerApplicationSummaryAdmin) => void;
  onPreviewPhoto: (application: CareerApplicationSummaryAdmin) => void;
}) {
  const [filters, setFilters] = useState<RecruitmentListFilters>({
    area: "",
    appliedFrom: "",
    appliedTo: "",
    candidateName: "",
    jobPosition: "",
    phone: "",
    status: "",
  });
  const jobPositionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          applications
            .map((application) => jobPositionFilterLabel(application))
            .filter(Boolean),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [applications],
  );
  const filteredApplications = useMemo(
    () =>
      applications.filter((application) =>
        matchesRecruitmentListFilters(application, filters),
      ),
    [applications, filters],
  );
  const hasActiveFilters = Object.values(filters).some(Boolean);

  function updateFilter(name: keyof RecruitmentListFilters, value: string) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      area: "",
      appliedFrom: "",
      appliedTo: "",
      candidateName: "",
      jobPosition: "",
      phone: "",
      status: "",
    });
  }

  return (
    <section className="admin-recruitment-list" aria-label="Recruitment list">
      <div className="admin-recruitment-filters" aria-label="Recruitment filters">
        <label>
          Candidate name
          <input
            onChange={(event) => updateFilter("candidateName", event.target.value)}
            type="search"
            value={filters.candidateName}
          />
        </label>
        <label>
          Phone
          <input
            onChange={(event) => updateFilter("phone", event.target.value)}
            type="search"
            value={filters.phone}
          />
        </label>
        <label>
          Area
          <input
            onChange={(event) => updateFilter("area", event.target.value)}
            type="search"
            value={filters.area}
          />
        </label>
        <fieldset className="admin-recruitment-date-filter">
          <legend>Applied date</legend>
          <div>
            <input
              aria-label="Applied from"
              onChange={(event) => updateFilter("appliedFrom", event.target.value)}
              type="date"
              value={filters.appliedFrom}
            />
            <span aria-hidden="true">to</span>
            <input
              aria-label="Applied to"
              onChange={(event) => updateFilter("appliedTo", event.target.value)}
              type="date"
              value={filters.appliedTo}
            />
          </div>
        </fieldset>
        <label>
          Job position
          <select
            onChange={(event) => updateFilter("jobPosition", event.target.value)}
            value={filters.jobPosition}
          >
            <option value="">All positions</option>
            {jobPositionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            onChange={(event) => updateFilter("status", event.target.value)}
            value={filters.status}
          >
            <option value="">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-recruitment-filter-actions">
          <span>
            {filteredApplications.length} of {applications.length}
          </span>
          <button disabled={!hasActiveFilters} onClick={resetFilters} type="button">
            Reset
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-recruitment-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Career</th>
              <th>Area</th>
              <th>Applied</th>
              <th>Status</th>
              <th className="admin-recruitment-action-head">Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((application) => (
              <tr key={application.id}>
                <td>
                  <div className="admin-recruitment-candidate-cell">
                    <ApplicantThumbnail
                      application={application}
                      onPreviewPhoto={onPreviewPhoto}
                    />
                    <span>
                      <strong>{application.full_name}</strong>
                      <small>{application.phone_number}</small>
                    </span>
                  </div>
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
                  <div className="admin-table-actions">
                    <button
                      aria-label={`Open ${application.full_name} candidate detail`}
                      onClick={() => onOpenApplication(application)}
                      title="Open detail"
                      type="button"
                    >
                      <ViewActionIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  {applications.length === 0
                    ? "No applications yet."
                    : "No applications match the filters."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecruitmentKanban({
  canMoveApplications,
  columns,
  movingApplicationId,
  onMoveApplication,
  onOpenApplication,
}: {
  canMoveApplications: boolean;
  columns: Array<RecruitmentColumn & { applications: CareerApplicationSummaryAdmin[] }>;
  movingApplicationId: string | null;
  onMoveApplication: (
    application: CareerApplicationSummaryAdmin,
    nextStatus: CareerApplicationStatus,
  ) => void;
  onOpenApplication: (application: CareerApplicationSummaryAdmin) => void;
}) {
  const [draggedApplicationId, setDraggedApplicationId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const applicationsById = useMemo(
    () =>
      new Map(
        columns.flatMap((column) =>
          column.applications.map((application) => [application.id, application] as const),
        ),
      ),
    [columns],
  );

  function startCardDrag(
    event: DragEvent<HTMLButtonElement>,
    application: CareerApplicationSummaryAdmin,
  ) {
    if (!canMoveApplications || movingApplicationId) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", application.id);
    setDraggedApplicationId(application.id);
  }

  function clearCardDrag() {
    setDraggedApplicationId(null);
    setDragOverColumnId(null);
  }

  function readDraggedApplication(event: DragEvent<HTMLElement>) {
    const applicationId =
      event.dataTransfer.getData("text/plain") || draggedApplicationId;
    return applicationId ? applicationsById.get(applicationId) ?? null : null;
  }

  function canDropOnColumn(
    application: CareerApplicationSummaryAdmin,
    column: RecruitmentColumn,
  ) {
    if (column.statuses.includes(application.status as CareerApplicationStatus)) {
      return true;
    }
    return canMoveApplicationToStatus(
      application.status,
      recruitmentColumnDropStatus(column),
    );
  }

  function dragOverColumn(
    event: DragEvent<HTMLElement>,
    column: RecruitmentColumn,
  ) {
    if (!canMoveApplications || !draggedApplicationId) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverColumnId(column.id);
  }

  function dropOnColumn(event: DragEvent<HTMLElement>, column: RecruitmentColumn) {
    event.preventDefault();
    const application = readDraggedApplication(event);
    clearCardDrag();
    if (!application || !canMoveApplications) {
      return;
    }
    if (column.statuses.includes(application.status as CareerApplicationStatus)) {
      return;
    }
    onMoveApplication(application, recruitmentColumnDropStatus(column));
  }

  return (
    <section className="admin-recruitment-kanban" aria-label="Recruitment kanban">
      {columns.map((column) => {
        const draggedApplication = draggedApplicationId
          ? applicationsById.get(draggedApplicationId)
          : null;
        const isDragOver = dragOverColumnId === column.id;
        const isDropAllowed = draggedApplication
          ? canDropOnColumn(draggedApplication, column)
          : false;

        return (
          <article
            className={[
              "admin-recruitment-column",
              isDragOver ? "is-drag-over" : "",
              isDragOver && !isDropAllowed ? "is-drop-blocked" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={column.id}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
                return;
              }
              setDragOverColumnId(null);
            }}
            onDragOver={(event) => dragOverColumn(event, column)}
            onDrop={(event) => dropOnColumn(event, column)}
          >
            <header>
              <h3>{column.label}</h3>
              <span>{column.applications.length}</span>
            </header>
            <div className="admin-recruitment-cards">
              {column.applications.map((application) => (
                <RecruitmentCard
                  application={application}
                  canDrag={canMoveApplications && !movingApplicationId}
                  isCompact={column.id === "done"}
                  isDragging={draggedApplicationId === application.id}
                  isUpdating={movingApplicationId === application.id}
                  key={application.id}
                  onDragEnd={clearCardDrag}
                  onDragStart={(event) => startCardDrag(event, application)}
                  onOpen={() => onOpenApplication(application)}
                />
              ))}
              {column.applications.length === 0 ? (
                <p className="admin-recruitment-empty">No applications</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function RecruitmentCard({
  application,
  canDrag,
  isCompact,
  isDragging,
  isUpdating,
  onDragEnd,
  onDragStart,
  onOpen,
}: {
  application: CareerApplicationSummaryAdmin;
  canDrag: boolean;
  isCompact: boolean;
  isDragging: boolean;
  isUpdating: boolean;
  onDragEnd: () => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onOpen: () => void;
}) {
  const cardTone = isCompact ? recruitmentDoneCardTone(application.status) : "";

  return (
    <button
      className={[
        "admin-recruitment-card",
        isCompact ? "is-compact" : "",
        canDrag ? "is-draggable" : "",
        isDragging ? "is-dragging" : "",
        isUpdating ? "is-updating" : "",
        cardTone,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isUpdating}
      draggable={canDrag}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
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
  onPreviewPhoto,
  onToast,
  onUpdateApplication,
  photoPreview,
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
  onPreviewPhoto: (
    application: CareerApplicationSummaryAdmin | CareerApplicationAdmin,
  ) => void;
  onToast: (toast: AdminToastState) => void;
  onUpdateApplication: (application: CareerApplicationAdmin) => void;
  photoPreview: RecruitmentPhotoPreview | null;
  selectedTab: RecruitmentDetailTab;
  setSelectedTab: (tab: RecruitmentDetailTab) => void;
}) {
  const [commentDraft, setCommentDraft] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const headerApplication = application ?? applicationSummary;

  const statusActions = application ? recruitmentStatusActions(application.status) : [];

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      if (photoPreview) {
        return;
      }
      event.preventDefault();
      onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, photoPreview]);

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
              <CandidatePhoto
                application={headerApplication}
                onPreviewPhoto={onPreviewPhoto}
              />
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
                className={[
                  selectedTab === tab.id ? "is-active" : "",
                  tab.id === "ai" ? "is-ai-tab" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                title={tab.label}
                type="button"
              >
                {tab.id === "ai" ? <span>AI</span> : <TabIcon name={tab.icon} />}
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

function ApplicantThumbnail({
  application,
  onPreviewPhoto,
}: {
  application: CareerApplicationSummaryAdmin;
  onPreviewPhoto: (application: CareerApplicationSummaryAdmin) => void;
}) {
  const content = application.self_photo_url ? (
    <img alt={`${application.full_name} photo`} src={application.self_photo_url} />
  ) : (
    <span>{application.full_name.charAt(0).toUpperCase()}</span>
  );

  if (!application.self_photo_url) {
    return <span className="admin-recruitment-applicant-thumb">{content}</span>;
  }

  return (
    <button
      aria-label={`Preview ${application.full_name} photo`}
      className="admin-recruitment-applicant-thumb"
      onClick={() => onPreviewPhoto(application)}
      title="Preview photo"
      type="button"
    >
      {content}
    </button>
  );
}

function CandidatePhoto({
  application,
  onPreviewPhoto,
}: {
  application: CareerApplicationSummaryAdmin | CareerApplicationAdmin | null;
  onPreviewPhoto: (
    application: CareerApplicationSummaryAdmin | CareerApplicationAdmin,
  ) => void;
}) {
  const content = application?.self_photo_url ? (
    <img alt={`${application.full_name} photo`} src={application.self_photo_url} />
  ) : (
    <span>{application?.full_name.charAt(0).toUpperCase() ?? "?"}</span>
  );

  if (!application?.self_photo_url) {
    return <div className="admin-recruitment-candidate-photo">{content}</div>;
  }

  return (
    <button
      aria-label={`Preview ${application.full_name} photo`}
      className="admin-recruitment-candidate-photo"
      onClick={() => onPreviewPhoto(application)}
      title="Preview photo"
      type="button"
    >
      {content}
    </button>
  );
}

function PhotoPreviewDialog({
  onClose,
  photo,
}: {
  onClose: () => void;
  photo: RecruitmentPhotoPreview;
}) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      aria-label={`${photo.name} photo preview`}
      aria-modal="true"
      className="admin-recruitment-photo-preview-backdrop"
      onClick={onClose}
      role="dialog"
    >
      <figure
        className="admin-recruitment-photo-preview"
        onClick={(event) => event.stopPropagation()}
      >
        <img alt={`${photo.name} photo`} src={photo.url} />
        <figcaption>{photo.name}</figcaption>
        <button
          aria-label="Close photo preview"
          onClick={onClose}
          title="Close"
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
          </svg>
        </button>
      </figure>
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
  if (tab === "ai") {
    return <AiApplicantInsight application={application} />;
  }

  if (tab === "position") {
    return (
      <>
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
          ]}
        />
        <DetailTextBlock
          label="Alasan layak untuk interview"
          value={application.interview_invitation_reason}
        />
      </>
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

function AiApplicantInsight({ application }: { application: CareerApplicationAdmin }) {
  const workCount = application.work_experiences.length;
  const organizationCount = application.organization_experiences.length;
  const socialCount = application.social_media_accounts.length;
  const familyCount = application.family_members.length;
  const documentScore = scoreCompletedItems([
    application.self_photo_url,
    application.cv_file_url,
    application.identity_number,
    application.driving_license_number,
    application.phone_number,
  ]);
  const profileDepthScore = Math.min(
    100,
    25 +
      workCount * 18 +
      organizationCount * 12 +
      socialCount * 8 +
      familyCount * 6,
  );
  const schedulingScore = scoreCompletedItems([
    application.available_interview_date,
    application.preferred_area,
    application.vacancy_source,
    application.interview_invitation_reason,
  ]);
  const overallScore = Math.round(
    documentScore * 0.4 + profileDepthScore * 0.35 + schedulingScore * 0.25,
  );
  const priority = aiPriorityLabel(application.status, overallScore);
  const metrics = [
    { label: "Document readiness", value: documentScore },
    { label: "Profile depth", value: profileDepthScore },
    { label: "Scheduling clarity", value: schedulingScore },
    { label: "HR review priority", value: overallScore },
  ];

  return (
    <div className="admin-recruitment-ai-insight">
      <section className="admin-recruitment-ai-hero" aria-label="Dummy AI applicant analytics">
        <div>
          <span>Dummy AI Insight</span>
          <h3>New Applicant Analytics</h3>
          <p>
            Senior HR view for quick triage. Use this as reading support only;
            final screening remains a recruiter decision.
          </p>
        </div>
        <strong className={`admin-recruitment-ai-priority ${priority.tone}`}>
          {priority.label}
        </strong>
      </section>

      <section className="admin-recruitment-ai-metrics" aria-label="Applicant analytics">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}%</strong>
            </div>
            <span className="admin-recruitment-ai-bar" aria-hidden="true">
              <span style={{ width: `${metric.value}%` }} />
            </span>
          </article>
        ))}
      </section>

      <DetailGrid
        items={[
          ["Candidate", application.full_name],
          ["Applied role", careerTitle(application)],
          ["Current stage", statusLabel(application.status)],
          ["Preferred area", application.preferred_area],
          ["Work entries", application.work_experiences.length],
          ["Organization entries", organizationCount],
        ]}
      />
      <DetailTextBlock
        label="Executive HR read"
        value={`${application.full_name} applied for ${careerTitle(application)} with preferred placement in ${formatMaybeValue(
          application.preferred_area,
        )}. The profile includes ${application.work_experiences.length} work experience entr${
          application.work_experiences.length === 1 ? "y" : "ies"
        } and ${application.organization_experiences.length} organization or training entr${
          application.organization_experiences.length === 1 ? "y" : "ies"
        }.`}
      />
      <DetailTextBlock
        label="Department head recommendation"
        value={`${priority.recommendation} Verify KTP/SIM validity, confirm the candidate's area flexibility, and compare the uploaded CV against the selected job requirements before moving stages.`}
      />
      <DetailTextBlock
        label="Governance note"
        value="Placeholder only. No automated hiring decision has been made; recruiters should use this as a quick reading aid, not as a scoring result."
      />
    </div>
  );
}

function scoreCompletedItems(values: Array<string | number | null | undefined>) {
  if (values.length === 0) {
    return 0;
  }
  const completedCount = values.filter((value) => formatMaybeValue(value) !== "-").length;
  return Math.round((completedCount / values.length) * 100);
}

function aiPriorityLabel(status: string, score: number) {
  if (status === "submitted" && score >= 76) {
    return {
      label: "High priority review",
      recommendation: "Prioritize for HR screening while the application is fresh.",
      tone: "high",
    };
  }
  if (score >= 60) {
    return {
      label: "Standard review",
      recommendation: "Proceed through the normal HR review queue.",
      tone: "standard",
    };
  }
  return {
    label: "Needs data check",
    recommendation: "Ask the candidate to clarify missing or thin profile data first.",
    tone: "check",
  };
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
  return (
    <span className={`admin-status-pill ${recruitmentStatusTone(status)}`}>
      {statusLabel(status)}
    </span>
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

function jobPositionFilterLabel(application: CareerApplicationSummaryAdmin) {
  return (
    application.position_name ??
    application.job_title ??
    application.applied_position
  ).trim();
}

function matchesRecruitmentListFilters(
  application: CareerApplicationSummaryAdmin,
  filters: RecruitmentListFilters,
) {
  if (!includesNormalized(application.full_name, filters.candidateName)) {
    return false;
  }
  if (!includesNormalized(application.phone_number, filters.phone)) {
    return false;
  }
  if (!includesNormalized(application.preferred_area ?? "", filters.area)) {
    return false;
  }
  if (
    filters.jobPosition &&
    ![
      application.position_name,
      application.job_title,
      application.applied_position,
    ].some(
      (value) =>
        normalizeFilterText(value ?? "") === normalizeFilterText(filters.jobPosition),
    )
  ) {
    return false;
  }
  if (filters.status && application.status !== filters.status) {
    return false;
  }
  return isWithinDateRange(application.applied_at, filters.appliedFrom, filters.appliedTo);
}

function includesNormalized(value: string, query: string) {
  const normalizedQuery = normalizeFilterText(query);
  if (!normalizedQuery) {
    return true;
  }
  return normalizeFilterText(value).includes(normalizedQuery);
}

function normalizeFilterText(value: string) {
  return value.trim().toLowerCase();
}

function isWithinDateRange(value: string, fromDate: string, toDate: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }
  if (fromDate && timestamp < startOfDateInput(fromDate)) {
    return false;
  }
  if (toDate && timestamp > endOfDateInput(toDate)) {
    return false;
  }
  return true;
}

function startOfDateInput(value: string) {
  return new Date(`${value}T00:00:00`).getTime();
}

function endOfDateInput(value: string) {
  return new Date(`${value}T23:59:59.999`).getTime();
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

function recruitmentColumnDropStatus(column: RecruitmentColumn): CareerApplicationStatus {
  if (column.id === "done") {
    return "rejected";
  }
  return column.statuses[0];
}

function canMoveApplicationToStatus(status: string, nextStatus: CareerApplicationStatus) {
  return recruitmentStatusActions(status).some((action) => action.value === nextStatus);
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

function recruitmentStatusTone(status: string) {
  if (status === "submitted") {
    return "is-submitted";
  }
  if (status === "hr_interview") {
    return "is-hr-interview";
  }
  if (status === "user_interview") {
    return "is-user-interview";
  }
  if (status === "offer") {
    return "is-offer";
  }
  return recruitmentDoneCardTone(status);
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
