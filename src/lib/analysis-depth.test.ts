import { describe, it, expect } from "vitest";
import {
  ANALYSIS_DEPTHS,
  reviewMovetimeFor,
  puzzleMovetimeFor,
} from "./analysis-depth";

describe("ANALYSIS_DEPTHS", () => {
  it("defines exactly fast, balanced, and deep options", () => {
    const values = ANALYSIS_DEPTHS.map((d) => d.value).sort();
    expect(values).toEqual(["balanced", "deep", "fast"]);
  });
});

describe("reviewMovetimeFor", () => {
  it("gives more time per move as depth increases", () => {
    const fast = reviewMovetimeFor("fast", true);
    const balanced = reviewMovetimeFor("balanced", true);
    const deep = reviewMovetimeFor("deep", true);
    expect(fast).toBeLessThan(balanced);
    expect(balanced).toBeLessThan(deep);
  });

  it("gives single-threaded runs more time than multi-threaded, at the same depth", () => {
    for (const depth of ["fast", "balanced", "deep"] as const) {
      expect(reviewMovetimeFor(depth, false)).toBeGreaterThan(
        reviewMovetimeFor(depth, true),
      );
    }
  });

  it("matches the previous hardcoded defaults for 'balanced'", () => {
    // These were the original fixed values before the setting existed —
    // pinning them here guards against an accidental regression for
    // users who never touch the setting.
    expect(reviewMovetimeFor("balanced", true)).toBe(300);
    expect(reviewMovetimeFor("balanced", false)).toBe(600);
  });
});

describe("puzzleMovetimeFor", () => {
  it("gives more time per position as depth increases", () => {
    const fast = puzzleMovetimeFor("fast", true);
    const balanced = puzzleMovetimeFor("balanced", true);
    const deep = puzzleMovetimeFor("deep", true);
    expect(fast).toBeLessThan(balanced);
    expect(balanced).toBeLessThan(deep);
  });

  it("matches the previous hardcoded defaults for 'balanced'", () => {
    expect(puzzleMovetimeFor("balanced", true)).toBe(1200);
    expect(puzzleMovetimeFor("balanced", false)).toBe(2000);
  });
});
