"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    completeProgress();
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      if (
        link.target ||
        link.hasAttribute("download") ||
        link.origin !== window.location.origin
      ) {
        return;
      }

      const nextUrl = `${link.pathname}${link.search}`;
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (nextUrl !== currentUrl) {
        startProgress();
      }
    }

    function handleBeforeUnload() {
      startProgress();
    }

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearProgressTimers();
    };
  }, []);

  function startProgress() {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsVisible(true);
    setProgress((value) => (value > 0 && value < 100 ? value : 12));
    if (intervalRef.current) {
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 88) {
          return value;
        }
        return value + Math.max(2, (88 - value) * 0.12);
      });
    }, 180);
  }

  function completeProgress() {
    if (!isVisible && progress === 0) {
      return;
    }
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(100);
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
      hideTimeoutRef.current = null;
    }, 260);
  }

  function clearProgressTimers() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
    }
  }

  return (
    <div
      aria-hidden={!isVisible}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(progress)}
      className={isVisible ? "top-progress is-visible" : "top-progress"}
      role="progressbar"
    >
      <span style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}
