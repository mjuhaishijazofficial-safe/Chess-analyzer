"use client";

import { useEffect, useRef, useState } from "react";

// Google Translate's supported target languages — code + native name.
const LANGUAGES: Array<[code: string, name: string]> = [
  ["en", "English"],
  ["es", "Español"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["it", "Italiano"],
  ["pt", "Português"],
  ["ru", "Русский"],
  ["zh-CN", "中文 (简体)"],
  ["zh-TW", "中文 (繁體)"],
  ["ja", "日本語"],
  ["ko", "한국어"],
  ["ar", "العربية"],
  ["hi", "हिन्दी"],
  ["bn", "বাংলা"],
  ["ur", "اردو"],
  ["fa", "فارسی"],
  ["tr", "Türkçe"],
  ["vi", "Tiếng Việt"],
  ["th", "ไทย"],
  ["id", "Bahasa Indonesia"],
  ["ms", "Bahasa Melayu"],
  ["tl", "Filipino"],
  ["nl", "Nederlands"],
  ["sv", "Svenska"],
  ["no", "Norsk"],
  ["da", "Dansk"],
  ["fi", "Suomi"],
  ["pl", "Polski"],
  ["cs", "Čeština"],
  ["sk", "Slovenčina"],
  ["hu", "Magyar"],
  ["ro", "Română"],
  ["bg", "Български"],
  ["el", "Ελληνικά"],
  ["he", "עברית"],
  ["uk", "Українська"],
  ["sr", "Српски"],
  ["hr", "Hrvatski"],
  ["sl", "Slovenščina"],
  ["lt", "Lietuvių"],
  ["lv", "Latviešu"],
  ["et", "Eesti"],
  ["sq", "Shqip"],
  ["mk", "Македонски"],
  ["bs", "Bosanski"],
  ["is", "Íslenska"],
  ["ga", "Gaeilge"],
  ["mt", "Malti"],
  ["cy", "Cymraeg"],
  ["sw", "Kiswahili"],
  ["am", "አማርኛ"],
  ["ha", "Hausa"],
  ["yo", "Yorùbá"],
  ["ig", "Igbo"],
  ["zu", "isiZulu"],
  ["xh", "isiXhosa"],
  ["af", "Afrikaans"],
  ["so", "Soomaali"],
  ["ta", "தமிழ்"],
  ["te", "తెలుగు"],
  ["kn", "ಕನ್ನಡ"],
  ["ml", "മലയാളം"],
  ["mr", "मराठी"],
  ["gu", "ગુજરાતી"],
  ["pa", "ਪੰਜਾਬੀ"],
  ["or", "ଓଡ଼ିଆ"],
  ["ne", "नेपाली"],
  ["si", "සිංහල"],
  ["km", "ខ្មែរ"],
  ["lo", "ລາວ"],
  ["my", "မြန်မာ"],
  ["ka", "ქართული"],
  ["hy", "Հայերեն"],
  ["az", "Azərbaycan"],
  ["kk", "Қазақ"],
  ["uz", "Oʻzbek"],
  ["mn", "Монгол"],
  ["ps", "پښتو"],
  ["ku", "Kurdî"],
  ["sd", "سنڌي"],
  ["ht", "Kreyòl Ayisyen"],
  ["ca", "Català"],
  ["eu", "Euskara"],
  ["gl", "Galego"],
  ["yi", "ייִדיש"],
  ["la", "Latina"],
  ["mi", "Māori"],
  ["sm", "Samoan"],
];

const STORAGE_KEY = "chessdeeper-lang";

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
      if (typeof console !== "undefined") {
        console.warn("[language-switcher] skipped a stale removeChild (Google Translate DOM patch)");
      }
      return child;
    }
    return originalRemoveChild.apply(this, [child]) as T;
  };

  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== "undefined") {
        console.warn("[language-switcher] skipped a stale insertBefore (Google Translate DOM patch)");
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, [newNode, referenceNode]) as T;
  };

  return () => {
    Node.prototype.removeChild = originalRemoveChild;
    Node.prototype.insertBefore = originalInsertBefore;
  };
}

export function LanguageSwitcher() {
  const [selected, setSelected] = useState("en");
  const initialized = useRef(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setSelected(saved);

    if (initialized.current) return;
    initialized.current = true;

    const restoreDom = patchDomForTranslate();

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

    return () => {
      restoreDom();
    };
  }, []);

  function applyLanguage(code: string) {
    setSelected(code);
    window.localStorage.setItem(STORAGE_KEY, code);

    // The widget creates a <select class="goog-te-combo"> once it's
    // ready. It can take a moment after the script loads, so poll
    // briefly rather than assuming it already exists.
    let attempts = 0;
    const tryApply = () => {
      const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (combo) {
        combo.value = code;
        combo.dispatchEvent(new Event("change"));
        return;
      }
      attempts += 1;
      if (attempts < 40) setTimeout(tryApply, 250);
    };
    tryApply();
  }

  return (
    <div className="fixed right-4 top-4 z-40 sm:right-6 sm:top-6">
      {/* Google's own widget mounts here — kept visually hidden, we
          drive it with our own styled <select> below. Not display:none
          because the widget can fail to initialize into a hidden
          container in some browsers. */}
      <div
        id="google_translate_element"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
        aria-hidden="true"
      />
      <div className="notranslate inline-flex items-center gap-1.5 rounded-full border border-line bg-panel/80 px-3 py-1.5 backdrop-blur transition hover:border-accent/50">
        <span aria-hidden className="text-sm">
          🌐
        </span>
        <select
          aria-label="Choose language"
          value={selected}
          onChange={(e) => applyLanguage(e.target.value)}
          className="notranslate cursor-pointer appearance-none bg-transparent pr-1 text-xs font-semibold text-fg outline-none [color-scheme:dark]"
        >
          {LANGUAGES.map(([code, name]) => (
            <option key={code} value={code} className="bg-panel text-fg">
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
