"use client";

import { useEffect } from "react";

/** Registers the PWA service worker. Renders nothing. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {
        // Non-fatal — the site works fine without it, it just won't be
        // installable as a PWA on this browser/session.
      });
    }
  }, []);

  return null;
}
