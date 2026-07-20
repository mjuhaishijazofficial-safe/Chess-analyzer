"use client";

import { useEffect, useState } from "react";

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

/**
 * Visible dropdown UI — homepage only, per design. The actual Google
 * Translate script/widget it drives is initialized site-wide by
 * `GoogleTranslateInit` in the root layout, so the language picked
 * here keeps applying as the person navigates to other pages (Google
 * remembers the choice via its own cookie).
 */
export function LanguageSwitcher() {
  const [selected, setSelected] = useState("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setSelected(saved);
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
