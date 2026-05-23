"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect } from "react";
import { useState } from "react";

import { adminClientRequest } from "../lib/client-api";
import { hasPermission } from "../lib/permissions";
import type { AdminUser, FAQAdmin, PublicServiceAdmin } from "../lib/types";
import { DeleteActionIcon, EditActionIcon } from "./AdminActionIcons";
import { AdminModal, ConfirmModal, ModalActions } from "./AdminModal";
import { AdminToast, type AdminToastState } from "./AdminToast";

type ServiceForm = {
  id: string;
  code: string;
  title: string;
  summary: string;
  sort_order: string;
  is_active: boolean;
};

type FAQForm = {
  id: string;
  code: string;
  question: string;
  answer: string;
  sort_order: string;
  is_active: boolean;
};

type ServiceModalState =
  | { type: "service-form"; mode: "create" | "edit" }
  | { type: "confirm-delete-service"; service: PublicServiceAdmin }
  | null;

type FAQModalState =
  | { type: "faq-form"; mode: "create" | "edit" }
  | { type: "confirm-delete-faq"; faq: FAQAdmin }
  | null;

const emptyServiceForm: ServiceForm = {
  id: "",
  code: "",
  title: "",
  summary: "",
  sort_order: "0",
  is_active: true,
};

const emptyFAQForm: FAQForm = {
  id: "",
  code: "",
  question: "",
  answer: "",
  sort_order: "0",
  is_active: true,
};

export function AdminServicesClient({
  currentUser,
  services,
}: {
  currentUser: AdminUser;
  services: PublicServiceAdmin[];
}) {
  const router = useRouter();
  const permissions = new Set(currentUser.role.permissions);
  const canReadServices = hasPermission(permissions, "service.read");
  const canCreateServices = hasPermission(permissions, "service.create");
  const canUpdateServices = hasPermission(permissions, "service.update");
  const canDeleteServices = hasPermission(permissions, "service.delete");
  const [serviceForm, setServiceForm] = useState<ServiceForm>(emptyServiceForm);
  const [orderedServices, setOrderedServices] = useState(() => sortByOrder(services));
  const [draggedServiceId, setDraggedServiceId] = useState<string | null>(null);
  const [dragOverServiceId, setDragOverServiceId] = useState<string | null>(null);
  const [modal, setModal] = useState<ServiceModalState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<AdminToastState>(null);

  useEffect(() => {
    setOrderedServices(sortByOrder(services));
  }, [services]);

  function openCreateService() {
    setServiceForm({
      ...emptyServiceForm,
      sort_order: String(nextSortOrder(orderedServices)),
    });
    setModal({ type: "service-form", mode: "create" });
  }

  function openEditService(service: PublicServiceAdmin) {
    setServiceForm({
      id: service.id,
      code: service.code,
      title: service.title,
      summary: service.summary,
      sort_order: String(service.sort_order),
      is_active: service.is_active,
    });
    setModal({ type: "service-form", mode: "edit" });
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal?.type !== "service-form") {
      return;
    }
    setIsLoading(true);
    setToast(null);
    const payload = {
      title: serviceForm.title,
      summary: serviceForm.summary,
      sort_order: Number(serviceForm.sort_order),
      is_active: serviceForm.is_active,
    };

    try {
      if (modal.mode === "create") {
        await adminClientRequest<PublicServiceAdmin>("/api/intl/v1/services", {
          method: "POST",
          body: JSON.stringify({ ...payload, code: serviceForm.code }),
        });
        setToast({ message: "Service created.", tone: "success" });
      } else {
        await adminClientRequest<PublicServiceAdmin>(
          `/api/intl/v1/services/${serviceForm.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        setToast({ message: "Service updated.", tone: "success" });
      }
      setModal(null);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to save service.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function reorderServices(targetServiceId: string) {
    if (!canUpdateServices || !draggedServiceId || draggedServiceId === targetServiceId) {
      clearServiceDragState();
      return;
    }
    const previousServices = orderedServices;
    const reorderedServices = withSequentialSortOrder(
      moveItem(previousServices, draggedServiceId, targetServiceId),
    );
    const changedServices = findOrderChanges(previousServices, reorderedServices);
    if (changedServices.length === 0) {
      clearServiceDragState();
      return;
    }

    setOrderedServices(reorderedServices);
    setIsLoading(true);
    setToast(null);
    try {
      await Promise.all(
        changedServices.map((service) =>
          adminClientRequest<PublicServiceAdmin>(
            `/api/intl/v1/services/${service.id}`,
            {
              method: "PATCH",
              body: JSON.stringify({ sort_order: service.sort_order }),
            },
          ),
        ),
      );
      setToast({ message: "Service order updated.", tone: "success" });
      router.refresh();
    } catch (error) {
      setOrderedServices(previousServices);
      setToast({
        message:
          error instanceof Error ? error.message : "Unable to update service order.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
      clearServiceDragState();
    }
  }

  function clearServiceDragState() {
    setDraggedServiceId(null);
    setDragOverServiceId(null);
  }

  async function deleteService(service: PublicServiceAdmin) {
    setIsLoading(true);
    setToast(null);
    try {
      await adminClientRequest<{ id: string }>(`/api/intl/v1/services/${service.id}`, {
        method: "DELETE",
      });
      setModal(null);
      setToast({ message: "Service deleted.", tone: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to delete service.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleServiceStatus(service: PublicServiceAdmin) {
    if (!canUpdateServices) {
      return;
    }
    setIsLoading(true);
    setToast(null);
    try {
      const nextStatus = !service.is_active;
      await adminClientRequest<PublicServiceAdmin>(
        `/api/intl/v1/services/${service.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_active: nextStatus }),
        },
      );
      setToast({
        message: nextStatus ? "Service set active." : "Service set inactive.",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Unable to update service status.",
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
          <p className="admin-kicker">Content Management</p>
          <h2>Services</h2>
        </div>
        <div className="admin-topbar-actions">
          <span>{orderedServices.length} services</span>
          {canCreateServices ? (
            <button className="admin-primary-button" onClick={openCreateService} type="button">
              New service
            </button>
          ) : null}
        </div>
      </header>

      {canReadServices ? (
        <div className="admin-table-wrap">
          <table className="admin-table admin-content-table">
            <thead>
              <tr>
                <th aria-label="Reorder" className="admin-drag-head" />
                <th>Title</th>
                <th>Summary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderedServices.map((service) => (
                <tr
                  className={dragOverServiceId === service.id ? "is-drag-over" : undefined}
                  draggable={canUpdateServices && !isLoading}
                  key={service.id}
                  onDragEnd={clearServiceDragState}
                  onDragOver={(event) => {
                    if (!draggedServiceId || draggedServiceId === service.id) {
                      return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverServiceId(service.id);
                  }}
                  onDragStart={(event) => {
                    if (!canUpdateServices || isLoading) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", service.id);
                    setDraggedServiceId(service.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void reorderServices(service.id);
                  }}
                >
                  <td className="admin-drag-cell">
                    <DragHandle isDisabled={!canUpdateServices || isLoading} />
                  </td>
                  <td>
                    <strong>{service.title}</strong>
                  </td>
                  <td>{service.summary}</td>
                  <td>
                    <StatusSwitch
                      isActive={service.is_active}
                      isDisabled={!canUpdateServices || isLoading}
                      label={`Set ${service.title} ${service.is_active ? "inactive" : "active"}`}
                      onToggle={() => void toggleServiceStatus(service)}
                    />
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      {canUpdateServices ? (
                        <button
                          aria-label={`Edit ${service.title}`}
                          disabled={isLoading}
                          onClick={() => openEditService(service)}
                          title="Edit"
                          type="button"
                        >
                          <EditActionIcon />
                        </button>
                      ) : null}
                      {canDeleteServices ? (
                        <button
                          aria-label={`Delete ${service.title}`}
                          className="is-danger"
                          disabled={isLoading}
                          onClick={() => setModal({ type: "confirm-delete-service", service })}
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
      ) : null}

      {modal?.type === "service-form" ? (
        <AdminModal
          onClose={() => setModal(null)}
          title={modal.mode === "create" ? "Create service" : "Edit service"}
        >
          <form className="admin-form" onSubmit={saveService}>
            <div className="admin-form-grid">
              <label>
                Code
                <input
                  disabled={modal.mode === "edit"}
                  onChange={(event) =>
                    setServiceForm((value) => ({ ...value, code: event.target.value }))
                  }
                  required
                  value={serviceForm.code}
                />
              </label>
              <label>
                Title
                <input
                  onChange={(event) =>
                    setServiceForm((value) => ({ ...value, title: event.target.value }))
                  }
                  required
                  value={serviceForm.title}
                />
              </label>
            </div>
            <label>
              Summary
              <textarea
                onChange={(event) =>
                  setServiceForm((value) => ({ ...value, summary: event.target.value }))
                }
                required
                rows={4}
                value={serviceForm.summary}
              />
            </label>
            <label className="admin-toggle">
              <input
                checked={serviceForm.is_active}
                onChange={(event) =>
                  setServiceForm((value) => ({ ...value, is_active: event.target.checked }))
                }
                type="checkbox"
              />
              <span>Visible on public site</span>
            </label>
            <ModalActions isLoading={isLoading} onCancel={() => setModal(null)} />
          </form>
        </AdminModal>
      ) : null}

      {modal?.type === "confirm-delete-service" ? (
        <ConfirmModal
          body={`Delete ${modal.service.title}? This removes it from the public service list.`}
          isLoading={isLoading}
          onCancel={() => setModal(null)}
          onConfirm={() => void deleteService(modal.service)}
          title="Delete service"
        />
      ) : null}
    </div>
  );
}

export function AdminFaqsClient({
  currentUser,
  faqs,
}: {
  currentUser: AdminUser;
  faqs: FAQAdmin[];
}) {
  const router = useRouter();
  const permissions = new Set(currentUser.role.permissions);
  const canReadFaqs = hasPermission(permissions, "faq.read");
  const canCreateFaqs = hasPermission(permissions, "faq.create");
  const canUpdateFaqs = hasPermission(permissions, "faq.update");
  const canDeleteFaqs = hasPermission(permissions, "faq.delete");
  const [faqForm, setFAQForm] = useState<FAQForm>(emptyFAQForm);
  const [orderedFaqs, setOrderedFaqs] = useState(() => sortByOrder(faqs));
  const [draggedFAQId, setDraggedFAQId] = useState<string | null>(null);
  const [dragOverFAQId, setDragOverFAQId] = useState<string | null>(null);
  const [modal, setModal] = useState<FAQModalState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<AdminToastState>(null);

  useEffect(() => {
    setOrderedFaqs(sortByOrder(faqs));
  }, [faqs]);

  function openCreateFAQ() {
    setFAQForm({
      ...emptyFAQForm,
      sort_order: String(nextSortOrder(orderedFaqs)),
    });
    setModal({ type: "faq-form", mode: "create" });
  }

  function openEditFAQ(faq: FAQAdmin) {
    setFAQForm({
      id: faq.id,
      code: faq.code,
      question: faq.question,
      answer: faq.answer,
      sort_order: String(faq.sort_order),
      is_active: faq.is_active,
    });
    setModal({ type: "faq-form", mode: "edit" });
  }

  async function saveFAQ(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal?.type !== "faq-form") {
      return;
    }
    setIsLoading(true);
    setToast(null);
    const payload = {
      question: faqForm.question,
      answer: faqForm.answer,
      sort_order: Number(faqForm.sort_order),
      is_active: faqForm.is_active,
    };

    try {
      if (modal.mode === "create") {
        await adminClientRequest<FAQAdmin>("/api/intl/v1/faqs", {
          method: "POST",
          body: JSON.stringify({ ...payload, code: faqForm.code }),
        });
        setToast({ message: "FAQ created.", tone: "success" });
      } else {
        await adminClientRequest<FAQAdmin>(`/api/intl/v1/faqs/${faqForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setToast({ message: "FAQ updated.", tone: "success" });
      }
      setModal(null);
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to save FAQ.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function reorderFaqs(targetFAQId: string) {
    if (!canUpdateFaqs || !draggedFAQId || draggedFAQId === targetFAQId) {
      clearFAQDragState();
      return;
    }
    const previousFaqs = orderedFaqs;
    const reorderedFaqs = withSequentialSortOrder(
      moveItem(previousFaqs, draggedFAQId, targetFAQId),
    );
    const changedFaqs = findOrderChanges(previousFaqs, reorderedFaqs);
    if (changedFaqs.length === 0) {
      clearFAQDragState();
      return;
    }

    setOrderedFaqs(reorderedFaqs);
    setIsLoading(true);
    setToast(null);
    try {
      await Promise.all(
        changedFaqs.map((faq) =>
          adminClientRequest<FAQAdmin>(`/api/intl/v1/faqs/${faq.id}`, {
            method: "PATCH",
            body: JSON.stringify({ sort_order: faq.sort_order }),
          }),
        ),
      );
      setToast({ message: "FAQ order updated.", tone: "success" });
      router.refresh();
    } catch (error) {
      setOrderedFaqs(previousFaqs);
      setToast({
        message: error instanceof Error ? error.message : "Unable to update FAQ order.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
      clearFAQDragState();
    }
  }

  function clearFAQDragState() {
    setDraggedFAQId(null);
    setDragOverFAQId(null);
  }

  async function deleteFAQ(faq: FAQAdmin) {
    setIsLoading(true);
    setToast(null);
    try {
      await adminClientRequest<{ id: string }>(`/api/intl/v1/faqs/${faq.id}`, {
        method: "DELETE",
      });
      setModal(null);
      setToast({ message: "FAQ deleted.", tone: "success" });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to delete FAQ.",
        tone: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleFAQStatus(faq: FAQAdmin) {
    if (!canUpdateFaqs) {
      return;
    }
    setIsLoading(true);
    setToast(null);
    try {
      const nextStatus = !faq.is_active;
      await adminClientRequest<FAQAdmin>(`/api/intl/v1/faqs/${faq.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextStatus }),
      });
      setToast({
        message: nextStatus ? "FAQ set active." : "FAQ set inactive.",
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to update FAQ status.",
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
          <p className="admin-kicker">Content Management</p>
          <h2>FAQ</h2>
        </div>
        <div className="admin-topbar-actions">
          <span>{orderedFaqs.length} questions</span>
          {canCreateFaqs ? (
            <button className="admin-primary-button" onClick={openCreateFAQ} type="button">
              New FAQ
            </button>
          ) : null}
        </div>
      </header>

      {canReadFaqs ? (
        <div className="admin-table-wrap">
          <table className="admin-table admin-content-table">
            <thead>
              <tr>
                <th aria-label="Reorder" className="admin-drag-head" />
                <th>Question</th>
                <th>Answer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderedFaqs.map((faq) => (
                <tr
                  className={dragOverFAQId === faq.id ? "is-drag-over" : undefined}
                  draggable={canUpdateFaqs && !isLoading}
                  key={faq.id}
                  onDragEnd={clearFAQDragState}
                  onDragOver={(event) => {
                    if (!draggedFAQId || draggedFAQId === faq.id) {
                      return;
                    }
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDragOverFAQId(faq.id);
                  }}
                  onDragStart={(event) => {
                    if (!canUpdateFaqs || isLoading) {
                      event.preventDefault();
                      return;
                    }
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", faq.id);
                    setDraggedFAQId(faq.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void reorderFaqs(faq.id);
                  }}
                >
                  <td className="admin-drag-cell">
                    <DragHandle isDisabled={!canUpdateFaqs || isLoading} />
                  </td>
                  <td>
                    <strong>{faq.question}</strong>
                  </td>
                  <td>{faq.answer}</td>
                  <td>
                    <StatusSwitch
                      isActive={faq.is_active}
                      isDisabled={!canUpdateFaqs || isLoading}
                      label={`Set FAQ ${faq.is_active ? "inactive" : "active"}`}
                      onToggle={() => void toggleFAQStatus(faq)}
                    />
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      {canUpdateFaqs ? (
                        <button
                          aria-label={`Edit ${faq.question}`}
                          disabled={isLoading}
                          onClick={() => openEditFAQ(faq)}
                          title="Edit"
                          type="button"
                        >
                          <EditActionIcon />
                        </button>
                      ) : null}
                      {canDeleteFaqs ? (
                        <button
                          aria-label={`Delete ${faq.question}`}
                          className="is-danger"
                          disabled={isLoading}
                          onClick={() => setModal({ type: "confirm-delete-faq", faq })}
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
      ) : null}

      {modal?.type === "faq-form" ? (
        <AdminModal
          onClose={() => setModal(null)}
          title={modal.mode === "create" ? "Create FAQ" : "Edit FAQ"}
        >
          <form className="admin-form" onSubmit={saveFAQ}>
            <label>
              Code
              <input
                disabled={modal.mode === "edit"}
                onChange={(event) =>
                  setFAQForm((value) => ({ ...value, code: event.target.value }))
                }
                required
                value={faqForm.code}
              />
            </label>
            <label>
              Question
              <textarea
                onChange={(event) =>
                  setFAQForm((value) => ({ ...value, question: event.target.value }))
                }
                required
                rows={3}
                value={faqForm.question}
              />
            </label>
            <label>
              Answer
              <textarea
                onChange={(event) =>
                  setFAQForm((value) => ({ ...value, answer: event.target.value }))
                }
                required
                rows={5}
                value={faqForm.answer}
              />
            </label>
            <label className="admin-toggle">
              <input
                checked={faqForm.is_active}
                onChange={(event) =>
                  setFAQForm((value) => ({ ...value, is_active: event.target.checked }))
                }
                type="checkbox"
              />
              <span>Visible on public site</span>
            </label>
            <ModalActions isLoading={isLoading} onCancel={() => setModal(null)} />
          </form>
        </AdminModal>
      ) : null}

      {modal?.type === "confirm-delete-faq" ? (
        <ConfirmModal
          body={`Delete ${modal.faq.question}? This removes it from the public FAQ list.`}
          isLoading={isLoading}
          onCancel={() => setModal(null)}
          onConfirm={() => void deleteFAQ(modal.faq)}
          title="Delete FAQ"
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

function sortByOrder<T extends { sort_order: number }>(items: T[]) {
  return [...items].sort((firstItem, secondItem) => {
    if (firstItem.sort_order !== secondItem.sort_order) {
      return firstItem.sort_order - secondItem.sort_order;
    }
    return 0;
  });
}

function moveItem<T extends { id: string }>(items: T[], sourceId: string, targetId: string) {
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
