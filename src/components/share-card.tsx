"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";

type ShareCardProps = {
  playerName: string;
  move: string;
};

export default function ShareCard({ playerName, move }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current);
    const link = document.createElement("a");
    link.download = "chessbuddy-move.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div>
      <div
        ref={cardRef}
        style={{ width: 500, height: 500, background: "black", color: "white", padding: 20 }}
      >
        <h1>Best Move!</h1>
        <p>{playerName} found {move}</p>
      </div>
      <button onClick={handleDownload} style={{ marginTop: 10, padding: "8px 16px" }}>
        Download PNG
      </button>
    </div>
  );
}