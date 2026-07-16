"use client";

/**
 * Lightweight, dependency-free sound effects using the Web Audio API.
 * No audio files are shipped — every sound is synthesized on the fly
 * (a mix of filtered noise "taps" for physical feel + clean tones for
 * the check alert), matching the project's "zero external assets"
 * philosophy (same idea as the hand-built SVG board and rating chart).
 */

const STORAGE_KEY = "chessdeeper-sound-enabled";

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    // Best-effort resume; browsers require a user gesture, which a
    // move/click already provides by the time this runs.
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function getNoiseBuffer(audio: AudioContext): AudioBuffer {
  if (!noiseBuffer || noiseBuffer.sampleRate !== audio.sampleRate) {
    const len = Math.floor(audio.sampleRate * 0.3);
    noiseBuffer = audio.createBuffer(1, len, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === null ? true : saved === "1";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}

/**
 * A short burst of filtered noise — simulates a physical "tap" of a
 * piece on the board, much closer to a real move/capture sound than
 * a plain oscillator beep.
 */
function playNoiseTap(opts: {
  freq: number;
  q?: number;
  duration: number;
  gain: number;
  delay?: number;
  filterType?: BiquadFilterType;
}) {
  const audio = getCtx();
  if (!audio) return;
  const start = audio.currentTime + (opts.delay ?? 0);

  const src = audio.createBufferSource();
  src.buffer = getNoiseBuffer(audio);

  const filter = audio.createBiquadFilter();
  filter.type = opts.filterType ?? "bandpass";
  filter.frequency.value = opts.freq;
  filter.Q.value = opts.q ?? 1.1;

  const gainNode = audio.createGain();
  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.exponentialRampToValueAtTime(opts.gain, start + 0.004);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);

  src.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audio.destination);
  src.start(start);
  src.stop(start + opts.duration + 0.02);
}

/** A clean tonal "ping" — used to build the check alert. */
function playTone(opts: {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}) {
  const audio = getCtx();
  if (!audio) return;
  const start = audio.currentTime + (opts.delay ?? 0);
  const peak = opts.gain ?? 0.2;

  const osc = audio.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, start);

  const gainNode = audio.createGain();
  gainNode.gain.setValueAtTime(0.0001, start);
  gainNode.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);

  osc.connect(gainNode);
  gainNode.connect(audio.destination);
  osc.start(start);
  osc.stop(start + opts.duration + 0.02);
}

/** Soft "click" for a normal move — a quiet, high, short wooden tap. */
export function playMoveSound() {
  if (!isSoundEnabled()) return;
  playNoiseTap({ freq: 2200, q: 2.2, duration: 0.045, gain: 0.5 });
  playNoiseTap({ freq: 500, q: 1, duration: 0.05, gain: 0.22, filterType: "lowpass" });
}

/** Heavier, lower "thud" for a capture — a piece knocking another off the board. */
export function playCaptureSound() {
  if (!isSoundEnabled()) return;
  playNoiseTap({ freq: 1400, q: 1.8, duration: 0.06, gain: 0.55 });
  playNoiseTap({ freq: 220, q: 0.9, duration: 0.14, gain: 0.5, filterType: "lowpass" });
}

/**
 * Short rising three-note chime for check (and checkmate) — distinct
 * and attention-grabbing without being harsh.
 */
export function playCheckSound() {
  if (!isSoundEnabled()) return;
  playNoiseTap({ freq: 1800, q: 1.5, duration: 0.05, gain: 0.4 });
  playTone({ freq: 587, duration: 0.14, type: "triangle", gain: 0.22, delay: 0.01 });
  playTone({ freq: 784, duration: 0.16, type: "triangle", gain: 0.24, delay: 0.11 });
  playTone({ freq: 987, duration: 0.22, type: "triangle", gain: 0.26, delay: 0.21 });
}

/**
 * Picks the right effect from a move's SAN notation:
 * check/checkmate > capture > plain move.
 */
export function playSoundForSan(san: string) {
  if (san.includes("#") || san.includes("+")) {
    playCheckSound();
  } else if (san.includes("x")) {
    playCaptureSound();
  } else {
    playMoveSound();
  }
}

