"use client";

import type { ReactNode } from "react";

export function AdminModal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div aria-modal="true" className="admin-modal-backdrop" role="dialog">
      <section className="admin-modal">
        <header className="admin-modal-head">
          <h3>{title}</h3>
          <button aria-label="Close" onClick={onClose} type="button">
            <CloseIcon />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function ConfirmModal({
  body,
  isLoading,
  onCancel,
  onConfirm,
  title,
}: {
  body: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <AdminModal onClose={onCancel} title={title}>
      <p className="admin-confirm-copy">{body}</p>
      <div className="admin-modal-actions">
        <button className="admin-text-button" onClick={onCancel} type="button">
          Cancel
        </button>
        <button
          className="admin-danger-button"
          disabled={isLoading}
          onClick={onConfirm}
          type="button"
        >
          Delete
        </button>
      </div>
    </AdminModal>
  );
}

export function ModalActions({
  isLoading,
  onCancel,
}: {
  isLoading: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="admin-modal-actions">
      <button className="admin-text-button" onClick={onCancel} type="button">
        Cancel
      </button>
      <button className="admin-primary-button" disabled={isLoading} type="submit">
        Save
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="admin-close-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M7 7l10 10" />
      <path d="M17 7L7 17" />
    </svg>
  );
}
