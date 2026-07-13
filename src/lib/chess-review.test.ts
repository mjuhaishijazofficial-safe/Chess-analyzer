import { describe, it, expect } from "vitest";
import {
  mateToCp,
  cpStm,
  cpWhite,
  winPercent,
  accuracyFromCPL,
  material,
  classifyMove,
  type ClassifyInput,
} from "./chess-review";

describe("mateToCp", () => {
  it("converts a positive mate distance to a large positive score", () => {
    expect(mateToCp(3)).toBeGreaterThan(90000);
  });

  it("converts a negative mate distance to a large negative score", () => {
    expect(mateToCp(-3)).toBeLessThan(-90000);
  });

  it("gets smaller in magnitude the further away mate is", () => {
    expect(mateToCp(1)).toBeGreaterThan(mateToCp(5));
  });
});

describe("cpStm / cpWhite", () => {
  it("returns 0 for an undefined line", () => {
    expect(cpStm(undefined)).toBe(0);
  });

  it("prefers mate score over centipawn score when both are present", () => {
    expect(cpStm({ move: "e2e4", scoreCp: 50, mate: 2, pv: [] })).toBe(
      mateToCp(2),
    );
  });

  it("falls back to centipawn score when there is no mate", () => {
    expect(cpStm({ move: "e2e4", scoreCp: 75, mate: null, pv: [] })).toBe(75);
  });

  it("flips sign for cpWhite when it's Black to move", () => {
    const line = { move: "e2e4", scoreCp: 100, mate: null, pv: [] };
    expect(cpWhite(line, true)).toBe(100);
    expect(cpWhite(line, false)).toBe(-100);
  });
});

describe("winPercent", () => {
  it("returns 50% at a dead-equal position", () => {
    expect(winPercent(0)).toBeCloseTo(50, 5);
  });

  it("increases with a bigger centipawn advantage", () => {
    expect(winPercent(500)).toBeGreaterThan(winPercent(100));
  });

  it("never goes below 0 or above 100", () => {
    expect(winPercent(-100000)).toBeGreaterThanOrEqual(0);
    expect(winPercent(100000)).toBeLessThanOrEqual(100);
  });
});

describe("accuracyFromCPL", () => {
  it("is 100% for zero centipawn loss", () => {
    expect(accuracyFromCPL(0)).toBeCloseTo(100, 5);
  });

  it("decreases as centipawn loss increases", () => {
    expect(accuracyFromCPL(200)).toBeLessThan(accuracyFromCPL(50));
  });

  it("never goes negative for very large losses", () => {
    expect(accuracyFromCPL(100000)).toBeGreaterThanOrEqual(0);
  });
});

describe("material", () => {
  const startFen =
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  it("counts full starting material for both sides", () => {
    // 8 pawns + 2 knights + 2 bishops + 2 rooks + 1 queen = 8+3*2+3*2+5*2+9 = 39
    expect(material(startFen, "w")).toBe(39);
    expect(material(startFen, "b")).toBe(39);
  });

  it("ignores kings (valued at 0) and the rest of the FEN fields", () => {
    const kingsOnly = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
    expect(material(kingsOnly, "w")).toBe(0);
    expect(material(kingsOnly, "b")).toBe(0);
  });

  it("counts an uneven material difference correctly", () => {
    // White has an extra queen versus bare kings.
    const fen = "4k3/8/8/8/8/8/8/3QK3 w - - 0 1";
    expect(material(fen, "w")).toBe(9);
    expect(material(fen, "b")).toBe(0);
  });
});

describe("classifyMove", () => {
  const base: ClassifyInput = {
    ply: 20,
    playedUci: "e2e4",
    bestUci: "e2e4",
    bestCpStm: 30,
    secondCpStm: -20,
    moverAfterCp: 30,
    legalCount: 30,
    sacrifice: 0,
    bookMatchPlies: 6,
  };

  it("classifies the only legal move as forced, regardless of anything else", () => {
    const result = classifyMove({ ...base, legalCount: 1, playedUci: "a1a2" });
    expect(result.classification).toBe("forced");
  });

  it("classifies a move within the opening book as book", () => {
    const result = classifyMove({ ...base, ply: 4, bookMatchPlies: 10 });
    expect(result.classification).toBe("book");
  });

  it("classifies the engine's top choice as best by default", () => {
    const result = classifyMove(base);
    expect(result.classification).toBe("best");
  });

  it("classifies the top choice as great when it's the only good move", () => {
    const result = classifyMove({ ...base, secondCpStm: -300 });
    expect(result.classification).toBe("great");
  });

  it("classifies a winning, surprising sacrifice as brilliant", () => {
    const result = classifyMove({
      ...base,
      sacrifice: 3,
      moverAfterCp: 200,
      secondCpStm: -200, // gap >= 150
    });
    expect(result.classification).toBe("brilliant");
  });

  it("classifies a small centipawn loss off the top move as excellent", () => {
    const result = classifyMove({
      ...base,
      playedUci: "d2d4",
      moverAfterCp: 10, // 20 cpl vs bestCpStm 30
    });
    expect(result.classification).toBe("excellent");
    expect(result.winDrop).toBe(20);
  });

  it("classifies a large centipawn loss as a blunder", () => {
    const result = classifyMove({
      ...base,
      playedUci: "d2d4",
      moverAfterCp: -300, // 330 cpl
    });
    expect(result.classification).toBe("blunder");
  });

  it("computes the gap to the second-best line when available", () => {
    const result = classifyMove(base);
    expect(result.gapToSecond).toBe(base.bestCpStm - (base.secondCpStm ?? 0));
  });

  it("returns a null gap when there is no second line", () => {
    const result = classifyMove({ ...base, secondCpStm: null });
    expect(result.gapToSecond).toBeNull();
  });
});
