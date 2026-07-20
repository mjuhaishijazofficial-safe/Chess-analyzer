"use client";

import { useEffect } from "react";

/**
 * No PWA service worker is currently shipped with this app (see
 * public/service-worker.js — it doesn't exist). This component used to
 * register one, which caused a 404 on every visit and left broken/stale
 * service workers registered in some browsers, intercepting requests for
 * the Stockfish engine files. This cleans those up instead.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  return null;
}