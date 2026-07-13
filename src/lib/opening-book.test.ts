import { describe, it, expect } from "vitest";
import { OPENING_BOOK, bookPlies, matchOpeningName } from "./opening-book";

describe("OPENING_BOOK data", () => {
  it("loaded a substantial number of named opening lines", () => {
    expect(OPENING_BOOK.length).toBeGreaterThan(1000);
  });

  it("every line has a non-empty eco code and name", () => {
    for (const line of OPENING_BOOK.slice(0, 200)) {
      expect(line.eco).toMatch(/^[A-E]\d{2}$/);
      expect(line.name.length).toBeGreaterThan(0);
    }
  });
});

describe("matchOpeningName", () => {
  it("identifies the Ruy Lopez from its move order", () => {
    const match = matchOpeningName(["e4", "e5", "Nf3", "Nc6", "Bb5"]);
    expect(match?.name).toBe("Ruy Lopez");
    expect(match?.eco).toBe("C60");
  });

  it("identifies the Italian Game from a different 5th move", () => {
    const match = matchOpeningName(["e4", "e5", "Nf3", "Nc6", "Bc4"]);
    expect(match?.name).toBe("Italian Game");
  });

  it("identifies the French Defense from just two moves", () => {
    const match = matchOpeningName(["e4", "e6"]);
    expect(match?.name).toBe("French Defense");
  });

  it("returns the deepest / most specific match, not just any match", () => {
    // Every prefix of these moves matches *something*; we want the
    // longest named line that's still a valid prefix.
    const match = matchOpeningName(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]);
    expect(match?.plies).toBeGreaterThanOrEqual(5);
  });

  it("returns null for an empty move list", () => {
    expect(matchOpeningName([])).toBeNull();
  });

  it("falls back to a shallow match once moves diverge from known theory", () => {
    // Every single reasonable first move is itself a named opening, so this
    // can't go all the way to null — but it should only match shallowly,
    // not claim some deep well-known line.
    const match = matchOpeningName(["h4", "a5", "h5", "a4"]);
    expect(match).not.toBeNull();
    expect(match!.plies).toBeLessThanOrEqual(2);
  });
});

describe("bookPlies", () => {
  it("measures how deep a well-known theoretical line goes", () => {
    const plies = bookPlies(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]);
    expect(plies).toBeGreaterThanOrEqual(6);
  });

  it("stays shallow once a game leaves known theory early", () => {
    // Every legal first move is itself named in the database, so depth
    // can't be 0 here — but it must stay low once the line goes off-book.
    const plies = bookPlies(["h4", "h5", "h3", "h6"]);
    expect(plies).toBeLessThanOrEqual(1);
  });

  it("never returns a depth greater than the number of moves given", () => {
    const moves = ["e4", "e5", "Nf3"];
    expect(bookPlies(moves)).toBeLessThanOrEqual(moves.length);
  });
});
