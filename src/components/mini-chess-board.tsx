// src/components/mini-chess-board.tsx
//
// Small, non-interactive board preview used inside Popular Opening cards.
// For the full interactive board with move-by-move navigation, use
// OpeningBoardViewer instead — this is intentionally lightweight.

import { miniBoardFromMoves } from "@/lib/mini-board";

interface MiniChessBoardProps {
  moves: string;
  size?: number; // total board size in px
}

export function MiniChessBoard({ moves, size = 96 }: MiniChessBoardProps) {
  const board = miniBoardFromMoves(moves);
  const squareSize = size / 8;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "grid",
        gridTemplateColumns: `repeat(8, ${squareSize}px)`,
        gridTemplateRows: `repeat(8, ${squareSize}px)`,
        borderRadius: 6,
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}
      aria-hidden="true"
    >
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isDark = (rowIndex + colIndex) % 2 === 1;
          // Piece color is fixed by side, not by square — matches how a
          // real chess set looks (white pieces are always light, black
          // pieces are always dark, regardless of the square they're on).
          const isWhitePiece =
            piece !== null && piece.charCodeAt(0) >= 0x2654 && piece.charCodeAt(0) <= 0x2659;

          return (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                width: squareSize,
                height: squareSize,
                background: isDark ? "#2D6A4F" : "#B7E4C7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: squareSize * 0.75,
                lineHeight: 1,
                color: piece ? (isWhitePiece ? "#faf8f3" : "#1c1712") : "transparent",
                textShadow: piece
                  ? isWhitePiece
                    ? "0 0 2px rgba(0,0,0,0.55)"
                    : "0 0 1px rgba(255,255,255,0.35)"
                  : "none",
              }}
            >
              {piece ?? ""}
            </div>
          );
        })
      )}
    </div>
  );
}
