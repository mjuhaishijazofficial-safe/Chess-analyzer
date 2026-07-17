"use client";

import { useEffect, useRef } from "react";

const GLYPHS = ["♙", "♟", "♘", "♗", "♖", "♕"];
const PARTICLE_COUNT = 18;

/**
 * Ambient floating chess-piece particles for hero backgrounds. Pieces
 * drift upward on a loop and can be grabbed and dragged around with the
 * mouse — the held piece gets a stronger glow so it's obviously "yours"
 * while you're holding it.
 *
 * Built with direct DOM manipulation inside a single effect (rather than
 * per-particle React state) since this is a decorative, non-critical
 * layer — keeps it cheap and matches how continuous CSS-driven animation
 * loops are normally done outside React's render cycle.
 */
export function FloatingPieceParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanups: Array<() => void> = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const el = document.createElement("span");
      el.className = "particle-piece";
      el.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      el.style.left = Math.random() * 96 + "%";
      el.style.bottom = -(Math.random() * 40 + 20) + "px";
      el.style.fontSize = 16 + Math.random() * 22 + "px";
      el.style.animationDuration = 12 + Math.random() * 14 + "s";
      el.style.animationDelay = Math.random() * 14 + "s";
      container.appendChild(el);
      cleanups.push(makeDraggable(el));
    }

    return () => {
      cleanups.forEach((fn) => fn());
      container.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}

/** Wires up mouse-drag behavior for one particle. Returns a cleanup fn. */
function makeDraggable(el: HTMLElement): () => void {
  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;

  const onMouseDown = (e: MouseEvent) => {
    dragging = true;
    el.classList.add("dragging");
    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    el.style.left = rect.left + "px";
    el.style.top = rect.top + "px";
    el.style.bottom = "auto";
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    el.style.left = e.clientX - offsetX + "px";
    el.style.top = e.clientY - offsetY + "px";
  };

  const onMouseUp = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("dragging");
    el.style.bottom = -(Math.random() * 40 + 20) + "px";
    el.style.top = "auto";
    // restart the rise animation from the bottom
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  };

  el.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);

  return () => {
    el.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };
}
