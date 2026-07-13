import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit, getClientIp } from "./rate-limit";

describe("rateLimit", () => {
  it("allows requests up to the limit", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(key, 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the request once the limit is exceeded", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    const result = rateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks each key independently", () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    for (let i = 0; i < 3; i++) rateLimit(keyA, 3, 60_000);
    // keyA is now exhausted, but keyB should be completely fresh.
    expect(rateLimit(keyA, 3, 60_000).allowed).toBe(false);
    expect(rateLimit(keyB, 3, 60_000).allowed).toBe(true);
  });

  it("reports decreasing remaining count as requests are used", () => {
    const key = `remaining-${Math.random()}`;
    const first = rateLimit(key, 3, 60_000);
    const second = rateLimit(key, 3, 60_000);
    expect(first.remaining).toBe(2);
    expect(second.remaining).toBe(1);
  });

  describe("with a fake clock", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("allows requests again once the window has passed", () => {
      const key = `window-${Math.random()}`;
      for (let i = 0; i < 2; i++) rateLimit(key, 2, 1000);
      expect(rateLimit(key, 2, 1000).allowed).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(rateLimit(key, 2, 1000).allowed).toBe(true);
    });
  });
});

describe("getClientIp", () => {
  it("reads the first address from x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.4, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.7" },
    });
    expect(getClientIp(req)).toBe("198.51.100.7");
  });

  it("falls back to 'unknown' when no IP headers are present", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });
});
