"use client";

import { useEffect } from "react";

/**
 * No PWA service worker is currently shipped with this app (public/service-worker.js
 * does not provide real functionality). This used to register one, which caused a
 * 404 on every visit and left broken/stale service workers registered in some
 * browsers, intercepting requests for the Stockfish engine files and causing
 * crash loops. This cleans up any old registrations instead of creating new ones.
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
