import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RateLimiter, exportRateLimiter, apiRateLimiter } from "@/lib/security/rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    // Create a fresh limiter for each test with short window for testing
    limiter = new RateLimiter({
      windowMs: 1000, // 1 second window
      maxRequests: 3,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("check", () => {
    it("should allow requests within limit", () => {
      const key = "test-user-1";

      // First request
      const result1 = limiter.check(key);
      expect(result1.allowed).toBe(true);
      expect(result1.current).toBe(1);
      expect(result1.limit).toBe(3);

      // Second request
      const result2 = limiter.check(key);
      expect(result2.allowed).toBe(true);
      expect(result2.current).toBe(2);

      // Third request
      const result3 = limiter.check(key);
      expect(result3.allowed).toBe(true);
      expect(result3.current).toBe(3);
    });

    it("should block requests exceeding limit", () => {
      const key = "test-user-2";

      // Use up all allowed requests
      limiter.check(key);
      limiter.check(key);
      limiter.check(key);

      // Fourth request should be blocked
      const result = limiter.check(key);
      expect(result.allowed).toBe(false);
      expect(result.current).toBe(3); // Still 3, not incremented
      expect(result.limit).toBe(3);
    });

    it("should track different keys independently", () => {
      const key1 = "user-1";
      const key2 = "user-2";

      // User 1 makes 3 requests
      limiter.check(key1);
      limiter.check(key1);
      limiter.check(key1);

      // User 2 should still be able to make requests
      const result1 = limiter.check(key2);
      expect(result1.allowed).toBe(true);
      expect(result1.current).toBe(1);

      // User 1 should still be blocked
      const result2 = limiter.check(key1);
      expect(result2.allowed).toBe(false);
      expect(result2.current).toBe(3);

      // User 2 can continue
      limiter.check(key2);
      limiter.check(key2);
      const result3 = limiter.check(key2);
      expect(result3.allowed).toBe(false);
      expect(result3.current).toBe(3);
    });

    it("should reset after window expires", async () => {
      vi.useFakeTimers();
      const key = "test-user-3";

      // Use up all allowed requests
      limiter.check(key);
      limiter.check(key);
      limiter.check(key);

      // Should be blocked
      let result = limiter.check(key);
      expect(result.allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(1100);

      // Should be allowed again
      result = limiter.check(key);
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(1);
    });

    it("should return correct reset time", () => {
      vi.useFakeTimers();
      const now = Date.now();
      const key = "test-user-4";

      const result = limiter.check(key);
      expect(result.resetAt).toBeGreaterThan(now);
      expect(result.resetIn).toBeLessThanOrEqual(1000);
      expect(result.resetIn).toBeGreaterThanOrEqual(0);
    });

    it("should use sliding window correctly", async () => {
      vi.useFakeTimers();
      const key = "test-user-5";

      // Make 2 requests at t=0
      limiter.check(key);
      limiter.check(key);

      // Advance 500ms (half the window)
      vi.advanceTimersByTime(500);

      // Make 1 more request (now at 3 total)
      limiter.check(key);

      // Should be blocked
      let result = limiter.check(key);
      expect(result.allowed).toBe(false);

      // Advance to t=600 (first 2 requests should still count)
      vi.advanceTimersByTime(100);
      result = limiter.check(key);
      expect(result.allowed).toBe(false);

      // Advance to t=1001 (first 2 requests expired, only 1 remains)
      vi.advanceTimersByTime(401);
      result = limiter.check(key);
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(2); // 1 old + 1 new
    });
  });

  describe("cleanup", () => {
    it("should remove expired entries", async () => {
      vi.useFakeTimers();
      const key = "cleanup-test";

      limiter.check(key);
      expect(limiter.size).toBe(1);

      // Advance past the window
      vi.advanceTimersByTime(1100);

      limiter.cleanup();
      expect(limiter.size).toBe(0);
    });

    it("should keep non-expired entries", () => {
      vi.useFakeTimers();
      const key = "cleanup-test-2";

      limiter.check(key);
      expect(limiter.size).toBe(1);

      // Advance but not past window
      vi.advanceTimersByTime(500);

      limiter.cleanup();
      expect(limiter.size).toBe(1);
    });
  });

  describe("clear", () => {
    it("should clear all entries", () => {
      limiter.check("key1");
      limiter.check("key2");
      limiter.check("key3");

      expect(limiter.size).toBe(3);

      limiter.clear();

      expect(limiter.size).toBe(0);
    });
  });

  describe("configSnapshot", () => {
    it("should return a copy of the config", () => {
      const config = limiter.configSnapshot;

      expect(config.windowMs).toBe(1000);
      expect(config.maxRequests).toBe(3);
    });
  });
});

describe("Pre-configured rate limiters", () => {
  it("exportRateLimiter should have correct config", () => {
    const config = exportRateLimiter.configSnapshot;
    expect(config.windowMs).toBe(60 * 60 * 1000); // 1 hour
    expect(config.maxRequests).toBe(20);
  });

  it("apiRateLimiter should have correct config", () => {
    const config = apiRateLimiter.configSnapshot;
    expect(config.windowMs).toBe(60 * 1000); // 1 minute
    expect(config.maxRequests).toBe(100);
  });
});
