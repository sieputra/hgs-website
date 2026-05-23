"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { adminClientRequest } from "../lib/client-api";
import { hasPermission } from "../lib/permissions";
import type {
  AdminUser,
  CareerJobAdmin,
  DivisionAdmin,
  PositionAdmin,
} from "../lib/types";
import { DeleteActionIcon, EditActionIcon } from "./AdminActionIcons";
import { AdminModal, ConfirmModal, ModalActions } from "./AdminModal";
import { AdminToast, type AdminToastState } from "./AdminToast";

type DivisionForm = {
  id: string;
  code: string;
  name: string;
  sort_order: string;
  is_active: boolean;
};

type JobForm = {
  id: string;
  code: string;
  slug: string;
  title: string;
  division_id: string;
  position_id: string;
  locations: string[];
  employment_type: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  sort_order: string;
  is_active: boolean;
};

type PositionForm = {
  id: string;
  division_id: string;
  code: string;
  name: string;
  sort_order: string;
  is_active: boolean;
};

type DivisionModalState =
  | { type: "division-form"; mode: "create" | "edit" }
  | { type: "confirm-delete-division"; division: DivisionAdmin }
  | null;

type PositionModalState =
  | { type: "position-form"; mode: "create" | "edit" }
  | { type: "confirm-delete-position"; position: PositionAdmin }
  | null;

type JobModalState =
  | { type: "job-form"; mode: "create" | "edit" }
  | { type: "confirm-delete-job"; job: CareerJobAdmin }
  | null;

const emptyDivisionForm: DivisionForm = {
  id: "",
  code: "",
  name: "",
  sort_order: "0",
  is_active: true,
};

const emptyJobForm: JobForm = {
  id: "",
  code: "",
  slug: "",
  title: "",
  division_id: "",
  position_id: "",
  locations: [],
  employment_type: "Full Time",
  summary: "",
  responsibilities: [""],
  requirements: [""],
  sort_order: "0",
  is_active: true,
};

const jobLocationOptions = ["Jakarta", "Bandung", "Bogor", "Subang", "Sukabumi"];
const employmentTypeOptions = ["Full Time", "Part Time"];

const emptyPositionForm: PositionForm = {
  id: "",
  division_id: "",
  code: "",
  name: "",
  sort_order: "0",
  is_active: true,
};

export function AdminDivisionsClient({
  currentUser,
  divisions,
}: {
  currentUser: AdminUser;
  divisions: DivisionAdmin[];
}) {
  const router = useRouter();
  const permissions = new Set(currentUser.role.permissions);
  const canReadDivisions = hasPermission(permissions, "division.read");
  const canCreateDivisions = hasPermission(permissions, "division.create");
  const canUpdateDivisions = hasPermission(permissions, "division.update");
  const canDeleteDivisions = hasPermission(permissions, "division.delete");
  const [divisionForm, setDivisionForm] =
    useState<DivisionForm>(emptyDivisionForm);
  const [orderedDivisions, setOrderedDivisions] = useState(() =>
    sortByOrder(divisions),
  );
  const [draggedDivisionId, setDraggedDivisionId] = useState<string | null>(null);
  const [dragOverDivisionId, setDragOverDivisionId] = useState<string | null>(null);
  const [modal, setModal] = useState<DivisionModalState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<AdminToastState>(null);

  useEffect(() => {
    setOrderedDivisions(sortByOrder(divisions));
  }, [divisions]);

  function openCreateDivision() {
    setDivisionForm({
      ...emptyDivisionForm,
      sort_order: String(nextSortOrder(orderedDivisions)),
    });
    setModal({ type: "division-form", mode: "create" });
  }

  function openEditDivision(division: DivisionAdmin) {
    setDivisionForm({
      id: division.id,
      code: division.code,
      name: division.name,
      sort_order: String(division.sort_order),
      is_active: division.is_active,
    });
    setModal({ type: "division-form", mode: "edit" });
  }

  async function saveDivision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal?.type !== "division-form") {
      return;
    }
    setIsLoading(true);
    setToast(null);
    const payload = {
      name: divisionForm.name,
      sort_order: Number(divisionForm.sort_order),
      is_active: divisionForm.is_active,
    };

    try {
      if (modal.mode === "create") {
        await adminClientRequest<DivisionAdmin>("/api/intl/v1/divisions", {
          method: "POST",
          body: JSON.stringify({ ...payload, code: divisionForm.code }),
        });
        setToast({ message: "Division created.", tone: "success" });
      } else {
        await adminClientRequest<DivisionAdmin>(
          `/api/intl/v1/divisions/${divisionForm.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        setToast({ message: "Division updated.", tone: "success" });
      }
      setModal(null);
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Unable to save division.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function reorderDivisions(targetDivisionId: string) {
    if (
      !canUpdateDivisions ||
      !draggedDivisionId ||
      draggedDivisionId === targetDivisionId
    ) {
      clearDivisionDragState();
      return;
    }
    const previousDivisions = orderedDivisions;
    const reorderedDivisions = withSequentialSortOrder(
      moveItem(previousDivisions, draggedDivisionId, targetDivisionId),
    );
    const changedDivisions = findOrderChanges(
      previousDivisions,
      reorderedDivisions,
    );
    if (changedDivisions.length === 0) {
      clearDivisionDragState();
      return;
    }

    setOrderedDivisions(reorderedDivisions);
    setIsLoading(true);
    setToast(null);
    try {
      await Promise.all(
        changedDivisions.map((division) =>
          adminClientRequest<DivisionAdmin>(
            `/api/intl/v1/divisions/${division.id}`,
            {
              method: "PATCH",
              body: JSON.stringify({ sort_order: division.sort_order }),
            },
          ),
        ),
      );
      setToast({ message: "Division order updated.", tone: "success" });
      router.refresh();
    } catch (error) {
      setOrderedDivisions(previousDivisions);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Unable to update division order.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
      clearDivisionDragState();
    }
  }

  function clearDivisionDragState() {
    setDraggedDivisionId(null);
    setDragOverDivisionId(null);
  }

  async function toggleDivisionStatus(division: DivisionAdmin) {
    if (!canUpdateDivisions) {
      return;
    }
    setIsLoading(true);
    setToast(null);
    try {
      const nextStatus = !division.is_active;
      await adminClientRequest<DivisionAdmin>(
        `/api/intl/v1/divisions/${division.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: nextStatus }),
        },
      );
      setToast({
        message: nextStatus ? "Division set active." : "Division set inactive.",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Unable to update division status.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteDivision(division: DivisionAdmin) {
    setIsLoading(true);
    setToast(null);
    try {
      await adminClientRequest<{ id: string }>(
        `/api/intl/v1/divisions/${division.id}`,
        { method: "DELETE" },
      );
      setModal(null);
      setToast({ message: "Division deleted.", tone: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Unable to delete division.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="admin-content-body">
      <AdminToast onClose={() => setToast(null)} toast={toast} />
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">Human Resources</p>
          <h2>Division</h2>
        </div>
        <div className="admin-topbar-actions">
          <span>{orderedDivisions.length} divisions</span>
          {canCreateDivisions ? (
            <button
              className="admin-primary-button"
              onClick={openCreateDivision}
              type="button"
            >
              New division
            </button>
          ) : null}
        </div>
      </header>

      {canReadDivisions ? (
        <div className="admin-table-wrap">
          <table className="admin-table admin-content-table">
            <thead>
              <tr>
                <th aria-label="Reorder" className="admin-drag-head" />
                <th>Name</th>
                <th>Positions</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderedDivisions.map((division) => (
                <tr
                  className={
                    dragOverDivisionId === division.id ? "is-drag-over" : undefined
                  }
                  draggable={canUpdateDivisions && !isLoading}
                  key={division.id}
                  onDragEnd={clearDivisionDragState}
                  onDragOver={(event) => {
                    if (!draggedDivisionId || draggedDivisionId === division.id) {
                      return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverDivisionId(division.id);
                  }}
                  onDragStart={(event) => {
                    if (!canUpdateDivisions || isLoading) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", division.id);
                    setDraggedDivisionId(division.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void reorderDivisions(division.id);
                  }}
                >
                  <td className="admin-drag-cell">
                    <DragHandle isDisabled={!canUpdateDivisions || isLoading} />
                  </td>
                  <td>
                    <strong>{division.name}</strong>
                    <small>{division.code}</small>
                  </td>
                  <td>{division.positions.length}</td>
                  <td>
                    <StatusSwitch
                      isActive={division.is_active}
                      isDisabled={!canUpdateDivisions || isLoading}
                      label={`Set ${division.name} ${
                        division.is_active ? "inactive" : "active"
                      }`}
                      onToggle={() => void toggleDivisionStatus(division)}
                    />
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      {canUpdateDivisions ? (
                        <button
                          aria-label={`Edit ${division.name}`}
                          disabled={isLoading}
                          onClick={() => openEditDivision(division)}
                          title="Edit"
                          type="button"
                        >
                          <EditActionIcon />
                        </button>
                      ) : null}
                      {canDeleteDivisions ? (
                        <button
                          aria-label={`Delete ${division.name}`}
                          className="is-danger"
                          disabled={isLoading}
                          onClick={() =>
                            setModal({
                              type: "confirm-delete-division",
                              division,
                            })
                          }
                          title="Delete"
                          type="button"
                        >
                          <DeleteActionIcon />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-notice">You do not have permission to view divisions.</p>
      )}

      {modal?.type === "division-form" ? (
        <AdminModal
          onClose={() => setModal(null)}
          title={modal.mode === "create" ? "Create division" : "Edit division"}
        >
          <form className="admin-form" onSubmit={saveDivision}>
            <div className="admin-form-grid">
              <label>
                Code
                <input
                  disabled={modal.mode === "edit"}
                  onChange={(event) =>
                    setDivisionForm((value) => ({
                      ...value,
                      code: event.target.value,
                    }))
                  }
                  required
                  value={divisionForm.code}
                />
              </label>
              <label>
                Name
                <input
                  onChange={(event) =>
                    setDivisionForm((value) => ({
                      ...value,
                      name: event.target.value,
                    }))
                  }
                  required
                  value={divisionForm.name}
                />
              </label>
            </div>
            <label className="admin-toggle">
              <input
                checked={divisionForm.is_active}
                onChange={(event) =>
                  setDivisionForm((value) => ({
                    ...value,
                    is_active: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>Visible on public recruitment forms</span>
            </label>
            <ModalActions isLoading={isLoading} onCancel={() => setModal(null)} />
          </form>
        </AdminModal>
      ) : null}

      {modal?.type === "confirm-delete-division" ? (
        <ConfirmModal
          body={`Delete ${modal.division.name}? Jobs keep their saved division text, but this removes the division master record.`}
          isLoading={isLoading}
          onCancel={() => setModal(null)}
          onConfirm={() => void deleteDivision(modal.division)}
          title="Delete division"
        />
      ) : null}
    </div>
  );
}

export function AdminPositionsClient({
  currentUser,
  divisions,
  positions,
}: {
  currentUser: AdminUser;
  divisions: DivisionAdmin[];
  positions: PositionAdmin[];
}) {
  const router = useRouter();
  const permissions = new Set(currentUser.role.permissions);
  const canReadPositions = hasPermission(permissions, "position.read");
  const canCreatePositions = hasPermission(permissions, "position.create");
  const canUpdatePositions = hasPermission(permissions, "position.update");
  const canDeletePositions = hasPermission(permissions, "position.delete");
  const [positionForm, setPositionForm] =
    useState<PositionForm>(emptyPositionForm);
  const [orderedPositions, setOrderedPositions] = useState(() =>
    sortByOrder(positions),
  );
  const [draggedPositionId, setDraggedPositionId] = useState<string | null>(null);
  const [dragOverPositionId, setDragOverPositionId] = useState<string | null>(null);
  const [modal, setModal] = useState<PositionModalState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<AdminToastState>(null);

  useEffect(() => {
    setOrderedPositions(sortByOrder(positions));
  }, [positions]);

  function divisionName(divisionId: string) {
    return (
      divisions.find((division) => division.id === divisionId)?.name ??
      "Unassigned division"
    );
  }

  function openCreatePosition() {
    setPositionForm({
      ...emptyPositionForm,
      division_id: divisions[0]?.id ?? "",
      sort_order: String(nextSortOrder(orderedPositions)),
    });
    setModal({ type: "position-form", mode: "create" });
  }

  function openEditPosition(position: PositionAdmin) {
    setPositionForm({
      id: position.id,
      division_id: position.division_id,
      code: position.code,
      name: position.name,
      sort_order: String(position.sort_order),
      is_active: position.is_active,
    });
    setModal({ type: "position-form", mode: "edit" });
  }

  async function savePosition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal?.type !== "position-form") {
      return;
    }
    if (!positionForm.division_id) {
      setToast({
        message: "Choose a division before saving a position.",
        tone: "error",
      });
      return;
    }

    setIsLoading(true);
    setToast(null);
    const payload = {
      division_id: positionForm.division_id,
      name: positionForm.name,
      sort_order: Number(positionForm.sort_order),
      is_active: positionForm.is_active,
    };

    try {
      if (modal.mode === "create") {
        await adminClientRequest<PositionAdmin>("/api/intl/v1/positions", {
          method: "POST",
          body: JSON.stringify({ ...payload, code: positionForm.code }),
        });
        setToast({ message: "Position created.", tone: "success" });
      } else {
        await adminClientRequest<PositionAdmin>(
          `/api/intl/v1/positions/${positionForm.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        setToast({ message: "Position updated.", tone: "success" });
      }
      setModal(null);
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Unable to save position.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function reorderPositions(targetPositionId: string) {
    if (
      !canUpdatePositions ||
      !draggedPositionId ||
      draggedPositionId === targetPositionId
    ) {
      clearPositionDragState();
      return;
    }
    const previousPositions = orderedPositions;
    const reorderedPositions = withSequentialSortOrder(
      moveItem(previousPositions, draggedPositionId, targetPositionId),
    );
    const changedPositions = findOrderChanges(
      previousPositions,
      reorderedPositions,
    );
    if (changedPositions.length === 0) {
      clearPositionDragState();
      return;
    }

    setOrderedPositions(reorderedPositions);
    setIsLoading(true);
    setToast(null);
    try {
      await Promise.all(
        changedPositions.map((position) =>
          adminClientRequest<PositionAdmin>(
            `/api/intl/v1/positions/${position.id}`,
            {
              method: "PATCH",
              body: JSON.stringify({ sort_order: position.sort_order }),
            },
          ),
        ),
      );
      setToast({ message: "Position order updated.", tone: "success" });
      router.refresh();
    } catch (error) {
      setOrderedPositions(previousPositions);
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Unable to update position order.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
      clearPositionDragState();
    }
  }

  function clearPositionDragState() {
    setDraggedPositionId(null);
    setDragOverPositionId(null);
  }

  async function togglePositionStatus(position: PositionAdmin) {
    if (!canUpdatePositions) {
      return;
    }
    setIsLoading(true);
    setToast(null);
    try {
      const nextStatus = !position.is_active;
      await adminClientRequest<PositionAdmin>(
        `/api/intl/v1/positions/${position.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: nextStatus }),
        },
      );
      setToast({
        message: nextStatus ? "Position set active." : "Position set inactive.",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Unable to update position status.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function deletePosition(position: PositionAdmin) {
    setIsLoading(true);
    setToast(null);
    try {
      await adminClientRequest<{ id: string }>(
        `/api/intl/v1/positions/${position.id}`,
        { method: "DELETE" },
      );
      setModal(null);
      setToast({ message: "Position deleted.", tone: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Unable to delete position.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="admin-content-body">
      <AdminToast onClose={() => setToast(null)} toast={toast} />
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">Human Resources</p>
          <h2>Position</h2>
        </div>
        <div className="admin-topbar-actions">
          <span>{orderedPositions.length} positions</span>
          {canCreatePositions ? (
            <button
              className="admin-primary-button"
              disabled={divisions.length === 0}
              onClick={openCreatePosition}
              type="button"
            >
              New position
            </button>
          ) : null}
        </div>
      </header>

      {canReadPositions ? (
        <div className="admin-table-wrap">
          <table className="admin-table admin-content-table">
            <thead>
              <tr>
                <th aria-label="Reorder" className="admin-drag-head" />
                <th>Name</th>
                <th>Division</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderedPositions.map((position) => (
                <tr
                  className={
                    dragOverPositionId === position.id ? "is-drag-over" : undefined
                  }
                  draggable={canUpdatePositions && !isLoading}
                  key={position.id}
                  onDragEnd={clearPositionDragState}
                  onDragOver={(event) => {
                    if (!draggedPositionId || draggedPositionId === position.id) {
                      return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverPositionId(position.id);
                  }}
                  onDragStart={(event) => {
                    if (!canUpdatePositions || isLoading) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", position.id);
                    setDraggedPositionId(position.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void reorderPositions(position.id);
                  }}
                >
                  <td className="admin-drag-cell">
                    <DragHandle isDisabled={!canUpdatePositions || isLoading} />
                  </td>
                  <td>
                    <strong>{position.name}</strong>
                    <small>{position.code}</small>
                  </td>
                  <td>{divisionName(position.division_id)}</td>
                  <td>
                    <StatusSwitch
                      isActive={position.is_active}
                      isDisabled={!canUpdatePositions || isLoading}
                      label={`Set ${position.name} ${
                        position.is_active ? "inactive" : "active"
                      }`}
                      onToggle={() => void togglePositionStatus(position)}
                    />
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      {canUpdatePositions ? (
                        <button
                          aria-label={`Edit ${position.name}`}
                          disabled={isLoading}
                          onClick={() => openEditPosition(position)}
                          title="Edit"
                          type="button"
                        >
                          <EditActionIcon />
                        </button>
                      ) : null}
                      {canDeletePositions ? (
                        <button
                          aria-label={`Delete ${position.name}`}
                          className="is-danger"
                          disabled={isLoading}
                          onClick={() =>
                            setModal({
                              type: "confirm-delete-position",
                              position,
                            })
                          }
                          title="Delete"
                          type="button"
                        >
                          <DeleteActionIcon />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-notice">You do not have permission to view positions.</p>
      )}

      {modal?.type === "position-form" ? (
        <AdminModal
          onClose={() => setModal(null)}
          title={modal.mode === "create" ? "Create position" : "Edit position"}
        >
          <form className="admin-form" onSubmit={savePosition}>
            <div className="admin-form-grid">
              <label>
                Code
                <input
                  disabled={modal.mode === "edit"}
                  onChange={(event) =>
                    setPositionForm((value) => ({
                      ...value,
                      code: event.target.value,
                    }))
                  }
                  required
                  value={positionForm.code}
                />
              </label>
              <label>
                Division
                <select
                  onChange={(event) =>
                    setPositionForm((value) => ({
                      ...value,
                      division_id: event.target.value,
                    }))
                  }
                  required
                  value={positionForm.division_id}
                >
                  <option value="">Choose division</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Name
              <input
                onChange={(event) =>
                  setPositionForm((value) => ({
                    ...value,
                    name: event.target.value,
                  }))
                }
                required
                value={positionForm.name}
              />
            </label>
            <label className="admin-toggle">
              <input
                checked={positionForm.is_active}
                onChange={(event) =>
                  setPositionForm((value) => ({
                    ...value,
                    is_active: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>Visible on public recruitment forms</span>
            </label>
            <ModalActions isLoading={isLoading} onCancel={() => setModal(null)} />
          </form>
        </AdminModal>
      ) : null}

      {modal?.type === "confirm-delete-position" ? (
        <ConfirmModal
          body={`Delete ${modal.position.name}? This removes the position from its division master data.`}
          isLoading={isLoading}
          onCancel={() => setModal(null)}
          onConfirm={() => void deletePosition(modal.position)}
          title="Delete position"
        />
      ) : null}
    </div>
  );
}

export function AdminJobsClient({
  currentUser,
  divisions,
  jobs,
  positions,
}: {
  currentUser: AdminUser;
  divisions: DivisionAdmin[];
  jobs: CareerJobAdmin[];
  positions: PositionAdmin[];
}) {
  const router = useRouter();
  const permissions = new Set(currentUser.role.permissions);
  const canReadJobs = hasPermission(permissions, "job.read");
  const canCreateJobs = hasPermission(permissions, "job.create");
  const canUpdateJobs = hasPermission(permissions, "job.update");
  const canDeleteJobs = hasPermission(permissions, "job.delete");
  const [jobForm, setJobForm] = useState<JobForm>(emptyJobForm);
  const [orderedJobs, setOrderedJobs] = useState(() => sortByOrder(jobs));
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverJobId, setDragOverJobId] = useState<string | null>(null);
  const [modal, setModal] = useState<JobModalState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<AdminToastState>(null);

  useEffect(() => {
    setOrderedJobs(sortByOrder(jobs));
  }, [jobs]);

  function positionsForDivision(divisionId: string) {
    return sortByOrder(
      positions.filter((position) => position.division_id === divisionId),
    );
  }

  function openCreateJob() {
    const divisionId = divisions[0]?.id ?? "";
    const positionId = positionsForDivision(divisionId)[0]?.id ?? "";
    setJobForm({
      ...emptyJobForm,
      division_id: divisionId,
      position_id: positionId,
      sort_order: String(nextSortOrder(orderedJobs)),
    });
    setModal({ type: "job-form", mode: "create" });
  }

  function openEditJob(job: CareerJobAdmin) {
    setJobForm({
      id: job.id,
      code: job.code,
      slug: job.slug,
      title: job.title,
      division_id: job.division_id ?? "",
      position_id: job.position_id ?? "",
      locations: locationsFromJob(job.location),
      employment_type: normalizeEmploymentType(job.employment_type),
      summary: job.summary,
      responsibilities: job.responsibilities.length > 0 ? job.responsibilities : [""],
      requirements: job.requirements.length > 0 ? job.requirements : [""],
      sort_order: String(job.sort_order),
      is_active: job.is_active,
    });
    setModal({ type: "job-form", mode: "edit" });
  }

  async function saveJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal?.type !== "job-form") {
      return;
    }
    if (!jobForm.division_id) {
      setToast({ message: "Choose a division before saving a job.", tone: "error" });
      return;
    }
    if (!jobForm.position_id) {
      setToast({ message: "Choose a position before saving a job.", tone: "error" });
      return;
    }
    if (jobForm.locations.length === 0) {
      setToast({ message: "Choose at least one location.", tone: "error" });
      return;
    }
    const responsibilities = cleanListItems(jobForm.responsibilities);
    const requirements = cleanListItems(jobForm.requirements);
    if (responsibilities.length === 0 || requirements.length === 0) {
      setToast({
        message: "Add at least one responsibility and one requirement.",
        tone: "error",
      });
      return;
    }

    setIsLoading(true);
    setToast(null);
    const payload = {
      slug: jobForm.slug,
      title: jobForm.title,
      division_id: jobForm.division_id,
      position_id: jobForm.position_id,
      location: jobForm.locations.join(", "),
      employment_type: jobForm.employment_type,
      summary: jobForm.summary,
      responsibilities,
      requirements,
      sort_order: Number(jobForm.sort_order),
      is_active: jobForm.is_active,
    };

    try {
      if (modal.mode === "create") {
        await adminClientRequest<CareerJobAdmin>("/api/intl/v1/jobs", {
          method: "POST",
          body: JSON.stringify({ ...payload, code: jobForm.code }),
        });
        setToast({ message: "Job created.", tone: "success" });
      } else {
        await adminClientRequest<CareerJobAdmin>(
          `/api/intl/v1/jobs/${jobForm.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        setToast({ message: "Job updated.", tone: "success" });
      }
      setModal(null);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to save job.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function reorderJobs(targetJobId: string) {
    if (!canUpdateJobs || !draggedJobId || draggedJobId === targetJobId) {
      clearJobDragState();
      return;
    }
    const previousJobs = orderedJobs;
    const reorderedJobs = withSequentialSortOrder(
      moveItem(previousJobs, draggedJobId, targetJobId),
    );
    const changedJobs = findOrderChanges(previousJobs, reorderedJobs);
    if (changedJobs.length === 0) {
      clearJobDragState();
      return;
    }

    setOrderedJobs(reorderedJobs);
    setIsLoading(true);
    setToast(null);
    try {
      await Promise.all(
        changedJobs.map((job) =>
          adminClientRequest<CareerJobAdmin>(`/api/intl/v1/jobs/${job.id}`, {
            method: "PATCH",
            body: JSON.stringify({ sort_order: job.sort_order }),
          }),
        ),
      );
      setToast({ message: "Job order updated.", tone: "success" });
      router.refresh();
    } catch (error) {
      setOrderedJobs(previousJobs);
      setToast({
        message:
          error instanceof Error ? error.message : "Unable to update job order.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
      clearJobDragState();
    }
  }

  function clearJobDragState() {
    setDraggedJobId(null);
    setDragOverJobId(null);
  }

  async function toggleJobStatus(job: CareerJobAdmin) {
    if (!canUpdateJobs) {
      return;
    }
    setIsLoading(true);
    setToast(null);
    try {
      const nextStatus = !job.is_active;
      await adminClientRequest<CareerJobAdmin>(`/api/intl/v1/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextStatus }),
      });
      setToast({
        message: nextStatus ? "Job set active." : "Job set inactive.",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Unable to update job status.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteJob(job: CareerJobAdmin) {
    setIsLoading(true);
    setToast(null);
    try {
      await adminClientRequest<{ id: string }>(`/api/intl/v1/jobs/${job.id}`, {
        method: "DELETE",
      });
      setModal(null);
      setToast({ message: "Job deleted.", tone: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to delete job.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="admin-content-body">
      <AdminToast onClose={() => setToast(null)} toast={toast} />
      <header className="admin-topbar">
        <div>
          <p className="admin-kicker">Human Resources</p>
          <h2>Jobs</h2>
        </div>
        <div className="admin-topbar-actions">
          <span>{orderedJobs.length} jobs</span>
          {canCreateJobs ? (
            <button
              className="admin-primary-button"
              disabled={divisions.length === 0 || positions.length === 0}
              onClick={openCreateJob}
              type="button"
            >
              New job
            </button>
          ) : null}
        </div>
      </header>

      {canReadJobs ? (
        <div className="admin-table-wrap">
          <table className="admin-table admin-content-table">
            <thead>
              <tr>
                <th aria-label="Reorder" className="admin-drag-head" />
                <th>Title</th>
                <th>Division</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderedJobs.map((job) => (
                <tr
                  className={dragOverJobId === job.id ? "is-drag-over" : undefined}
                  draggable={canUpdateJobs && !isLoading}
                  key={job.id}
                  onDragEnd={clearJobDragState}
                  onDragOver={(event) => {
                    if (!draggedJobId || draggedJobId === job.id) {
                      return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverJobId(job.id);
                  }}
                  onDragStart={(event) => {
                    if (!canUpdateJobs || isLoading) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", job.id);
                    setDraggedJobId(job.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void reorderJobs(job.id);
                  }}
                >
                  <td className="admin-drag-cell">
                    <DragHandle isDisabled={!canUpdateJobs || isLoading} />
                  </td>
                  <td>
                    <strong>{job.title}</strong>
                    <small>{job.slug}</small>
                  </td>
                  <td>
                    {job.division_name}
                    <small>{job.position_name}</small>
                  </td>
                  <td>{job.location}</td>
                  <td>
                    <StatusSwitch
                      isActive={job.is_active}
                      isDisabled={!canUpdateJobs || isLoading}
                      label={`Set ${job.title} ${
                        job.is_active ? "inactive" : "active"
                      }`}
                      onToggle={() => void toggleJobStatus(job)}
                    />
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      {canUpdateJobs ? (
                        <button
                          aria-label={`Edit ${job.title}`}
                          disabled={isLoading}
                          onClick={() => openEditJob(job)}
                          title="Edit"
                          type="button"
                        >
                          <EditActionIcon />
                        </button>
                      ) : null}
                      {canDeleteJobs ? (
                        <button
                          aria-label={`Delete ${job.title}`}
                          className="is-danger"
                          disabled={isLoading}
                          onClick={() => setModal({ type: "confirm-delete-job", job })}
                          title="Delete"
                          type="button"
                        >
                          <DeleteActionIcon />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-notice">You do not have permission to view jobs.</p>
      )}

      {modal?.type === "job-form" ? (
        <AdminModal
          onClose={() => setModal(null)}
          title={modal.mode === "create" ? "Create job" : "Edit job"}
        >
          <form className="admin-form" onSubmit={saveJob}>
            <div className="admin-form-grid">
              <label>
                Code
                <input
                  disabled={modal.mode === "edit"}
                  onChange={(event) =>
                    setJobForm((value) => ({ ...value, code: event.target.value }))
                  }
                  required
                  value={jobForm.code}
                />
              </label>
              <label>
                Slug
                <input
                  onChange={(event) =>
                    setJobForm((value) => ({ ...value, slug: event.target.value }))
                  }
                  required
                  value={jobForm.slug}
                />
              </label>
              <label>
                Title
                <input
                  onChange={(event) =>
                    setJobForm((value) => ({ ...value, title: event.target.value }))
                  }
                  required
                  value={jobForm.title}
                />
              </label>
              <label>
                Division
                <select
                  onChange={(event) =>
                    setJobForm((value) => {
                      const divisionId = event.target.value;
                      return {
                        ...value,
                        division_id: divisionId,
                        position_id: positionsForDivision(divisionId)[0]?.id ?? "",
                      };
                    })
                  }
                  required={modal.mode === "create"}
                  value={jobForm.division_id}
                >
                  <option value="">Choose division</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Position
                <select
                  onChange={(event) =>
                    setJobForm((value) => ({
                      ...value,
                      position_id: event.target.value,
                    }))
                  }
                  required
                  value={jobForm.position_id}
                >
                  <option value="">Choose position</option>
                  {positionsForDivision(jobForm.division_id).map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="admin-field-stack">
                <p className="admin-field-label">Location</p>
                <MultiSelectDropdown
                  onChange={(locations) =>
                    setJobForm((value) => ({ ...value, locations }))
                  }
                  options={jobLocationOptions}
                  placeholder="Choose locations"
                  value={jobForm.locations}
                />
              </div>
              <label>
                Employment type
                <select
                  onChange={(event) =>
                    setJobForm((value) => ({
                      ...value,
                      employment_type: event.target.value,
                    }))
                  }
                  required
                  value={jobForm.employment_type}
                >
                  {employmentTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Summary
              <textarea
                onChange={(event) =>
                  setJobForm((value) => ({ ...value, summary: event.target.value }))
                }
                required
                rows={3}
                value={jobForm.summary}
              />
            </label>
            <div className="admin-form-grid">
              <JobListEditor
                label="Responsibilities"
                onChange={(responsibilities) =>
                  setJobForm((value) => ({ ...value, responsibilities }))
                }
                value={jobForm.responsibilities}
              />
              <JobListEditor
                label="Requirements"
                onChange={(requirements) =>
                  setJobForm((value) => ({ ...value, requirements }))
                }
                value={jobForm.requirements}
              />
            </div>
            <label className="admin-toggle">
              <input
                checked={jobForm.is_active}
                onChange={(event) =>
                  setJobForm((value) => ({
                    ...value,
                    is_active: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>Visible on public careers pages</span>
            </label>
            <ModalActions isLoading={isLoading} onCancel={() => setModal(null)} />
          </form>
        </AdminModal>
      ) : null}

      {modal?.type === "confirm-delete-job" ? (
        <ConfirmModal
          body={`Delete ${modal.job.title}? This removes it from the public jobs list.`}
          isLoading={isLoading}
          onCancel={() => setModal(null)}
          onConfirm={() => void deleteJob(modal.job)}
          title="Delete job"
        />
      ) : null}
    </div>
  );
}

function StatusSwitch({
  isActive,
  isDisabled,
  label,
  onToggle,
}: {
  isActive: boolean;
  isDisabled: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <label className="admin-status-switch">
      <input
        aria-label={label}
        checked={isActive}
        disabled={isDisabled}
        onChange={onToggle}
        role="switch"
        type="checkbox"
      />
      <span aria-hidden="true" className="admin-status-switch-track">
        <span className="admin-status-switch-thumb" />
      </span>
      <strong>{isActive ? "Active" : "Inactive"}</strong>
    </label>
  );
}

function DragHandle({ isDisabled }: { isDisabled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={isDisabled ? "admin-drag-handle is-disabled" : "admin-drag-handle"}
      title={isDisabled ? "Reordering unavailable" : "Drag to reorder"}
    >
      <span />
      <span />
      <span />
    </span>
  );
}

function MultiSelectDropdown({
  onChange,
  options,
  placeholder,
  value,
}: {
  onChange: (value: string[]) => void;
  options: string[];
  placeholder: string;
  value: string[];
}) {
  const label = value.length > 0 ? value.join(", ") : placeholder;

  function toggleOption(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }
    onChange([...value, option]);
  }

  return (
    <details className="admin-multiselect">
      <summary>
        <span>{label}</span>
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="admin-multiselect-menu">
        {options.map((option) => (
          <label className="admin-multiselect-option" key={option}>
            <input
              checked={value.includes(option)}
              onChange={() => toggleOption(option)}
              type="checkbox"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </details>
  );
}

function JobListEditor({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string[]) => void;
  value: string[];
}) {
  function updateItem(index: number, nextValue: string) {
    onChange(value.map((item, itemIndex) => (itemIndex === index ? nextValue : item)));
  }

  function addItem() {
    onChange([...value, ""]);
  }

  function removeItem(index: number) {
    if (value.length === 1) {
      onChange([""]);
      return;
    }
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <fieldset className="admin-list-editor">
      <legend>{label}</legend>
      {value.map((item, index) => (
        <div className="admin-list-editor-row" key={`${label}-${index}`}>
          <input
            aria-label={`${label} ${index + 1}`}
            onChange={(event) => updateItem(index, event.target.value)}
            value={item}
          />
          <button
            aria-label={`Remove ${label} ${index + 1}`}
            className="admin-secondary-button"
            onClick={() => removeItem(index)}
            type="button"
          >
            Delete
          </button>
        </div>
      ))}
      <button className="admin-text-button" onClick={addItem} type="button">
        Add {label.toLowerCase()}
      </button>
    </fieldset>
  );
}

function sortByOrder<T extends { sort_order: number }>(items: T[]) {
  return [...items].sort((firstItem, secondItem) => {
    if (firstItem.sort_order !== secondItem.sort_order) {
      return firstItem.sort_order - secondItem.sort_order;
    }
    return 0;
  });
}

function moveItem<T extends { id: string }>(
  items: T[],
  sourceId: string,
  targetId: string,
) {
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(targetIndex, 0, movedItem);
  return nextItems;
}

function withSequentialSortOrder<T extends { sort_order: number }>(items: T[]) {
  return items.map((item, index) => ({
    ...item,
    sort_order: index + 1,
  }));
}

function findOrderChanges<T extends { id: string; sort_order: number }>(
  previousItems: T[],
  nextItems: T[],
) {
  return nextItems.filter((nextItem) => {
    const previousItem = previousItems.find((item) => item.id === nextItem.id);
    return previousItem?.sort_order !== nextItem.sort_order;
  });
}

function nextSortOrder(items: Array<{ sort_order: number }>) {
  if (items.length === 0) {
    return 1;
  }
  return Math.max(...items.map((item) => item.sort_order)) + 1;
}

function cleanListItems(value: string[]) {
  return value.map((item) => item.trim()).filter(Boolean);
}

function locationsFromJob(value: string) {
  return value
    .split(",")
    .map((line) => line.trim())
    .filter((line) => jobLocationOptions.includes(line));
}

function normalizeEmploymentType(value: string) {
  if (value.toLowerCase().replace("-", " ") === "part time") {
    return "Part Time";
  }
  return "Full Time";
}
