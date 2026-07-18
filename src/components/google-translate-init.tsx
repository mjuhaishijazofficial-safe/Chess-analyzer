"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay: boolean },
          elementId: string,
        ) => unknown;
      };
    };
  }
}

/**
 * Fixes a well-known React + Google Translate crash: Google Translate
 * rewrites text nodes directly in the DOM, so when React later tries to
 * remove/reorder a node it no longer recognizes, `removeChild`/
 * `insertBefore` throw a DOMException and crash the app. This patches
 * both to no-op instead of throwing when the node isn't actually a
 * child. Community-standard workaround for this exact combination.
 */
function patchDomForTranslate() {
  const originalRemoveChild = Node.prototype.removeChild;
  const originalInsertBefore = Node.prototype.insertBefore;

  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };

  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };
}

/**
 * Mounted once in the root layout so it's present on every page. Loads
 * the Google Translate script and keeps a hidden widget instance alive
 * site-wide, so a language chosen on the homepage (via
 * `LanguageSwitcher`) keeps applying as the person navigates to other
 * pages — Google Translate remembers the choice itself via its own
 * `googtrans` cookie and re-applies it on each page load once this
 * script has initialized.
 *
 * Renders nothing visible. `LanguageSwitcher` (homepage-only) is the
 * actual dropdown UI; this component just needs to exist on the page
 * for translation to be available at all.
 */
export function GoogleTranslateInit() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    patchDomForTranslate();

    window.googleTranslateElementInit = () => {
      if (!window.google) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element",
      );
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }

    // Belt-and-suspenders: Google's own script sometimes re-applies
    // inline styles to keep its banner visible / push the page down.
    // Keep stamping it back closed for the first stretch after a
    // translation is triggered, then stop polling.
    let ticks = 0;
    const enforce = window.setInterval(() => {
      document.body.style.top = "0px";
      const banner = document.querySelector<HTMLElement>(".goog-te-banner-frame");
      if (banner) banner.style.display = "none";
      ticks += 1;
      if (ticks > 60) window.clearInterval(enforce);
    }, 500);
  }, []);

  return (
    <div
      id="google_translate_element"
      className="pointer-events-none fixed h-0 w-0 overflow-hidden opacity-0"
      aria-hidden="true"
    />
  );
}
