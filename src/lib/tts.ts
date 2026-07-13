"use client";

/**
 * Lightweight text-to-speech for the coach commentary, built on the
 * browser's native Web Speech API (SpeechSynthesis). No API key, no
 * backend, no cost — works entirely client-side.
 */

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesReady = false;

function loadVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  voicesReady = true;
  // Prefer a natural-sounding English voice if one is available.
  cachedVoice =
    voices.find((v) => /en-US/i.test(v.lang) && /Natural|Neural|Google/i.test(v.name)) ??
    voices.find((v) => /en/i.test(v.lang)) ??
    voices[0];
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, opts?: { rate?: number; pitch?: number }) {
  if (!isTtsSupported() || !text) return;
  if (!voicesReady) loadVoices();

  window.speechSynthesis.cancel(); // don't overlap with a previous line
  const utter = new SpeechSynthesisUtterance(text);
  if (cachedVoice) utter.voice = cachedVoice;
  utter.rate = opts?.rate ?? 1;
  utter.pitch = opts?.pitch ?? 1;
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (isTtsSupported()) window.speechSynthesis.cancel();
}
