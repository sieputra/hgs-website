"use client";

import { useEffect } from "react";

export type AdminToastState = {
  message: string;
  tone: "success" | "error";
} | null;

export function AdminToast({
  onClose,
  toast,
}: {
  onClose: () => void;
  toast: AdminToastState;
}) {
  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timeout);
  }, [onClose, toast]);

  if (!toast) {
    return null;
  }

  return (
    <div className="admin-toast-region" role="status" aria-live="polite">
      <div className={`admin-toast is-${toast.tone}`}>
        <p>{toast.message}</p>
        <button aria-label="Dismiss notification" onClick={onClose} type="button">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="admin-toast-close-icon" fill="none" viewBox="0 0 24 24">
      <path d="M7 7l10 10" />
      <path d="M17 7L7 17" />
    </svg>
  );
}
