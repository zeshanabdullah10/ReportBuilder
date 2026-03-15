/**
 * Rate Limiting Infrastructure
 *
 * Provides in-memory rate limiting using a sliding window algorithm.
 * Suitable for single-server deployments. For distributed systems,
 * consider using Redis-based rate limiting.
 */

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests made in the current window */
  current: number;
  /** Maximum requests allowed */
  limit: number;
  /** Time in milliseconds until the window resets */
  resetIn: number;
  /** Timestamp when the window will reset */
  resetAt: number;
}

/**
 * Internal entry to track requests for a key
 */
interface RequestEntry {
  timestamps: number[];
}

/**
 * In-memory rate limiter using sliding window algorithm
 */
export class RateLimiter {
  private entries: Map<string, RequestEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if a request is allowed for the given key
   *
   * @param key - Unique identifier for the rate limit (e.g., IP address, user ID)
   * @returns RateLimitResult indicating if the request is allowed and metadata
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create entry for this key
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.entries.set(key, entry);
    }

    // Remove expired timestamps (sliding window)
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    // Calculate current count and check limit
    const current = entry.timestamps.length;
    const allowed = current < this.config.maxRequests;

    // If allowed, record this request
    if (allowed) {
      entry.timestamps.push(now);
    }

    // Calculate reset time based on oldest timestamp in window
    let resetAt: number;
    if (entry.timestamps.length > 0) {
      // Reset when the oldest request expires
      resetAt = entry.timestamps[0] + this.config.windowMs;
    } else {
      // No requests in window, reset is the end of current window
      resetAt = now + this.config.windowMs;
    }

    const resetIn = Math.max(0, resetAt - now);

    return {
      allowed,
      current: allowed ? current + 1 : current,
      limit: this.config.maxRequests,
      resetIn,
      resetAt,
    };
  }

  /**
   * Remove all expired entries from memory
   * Should be called periodically to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, entry] of this.entries.entries()) {
      // Filter out expired timestamps
      entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

      // Remove entry entirely if no timestamps remain
      if (entry.timestamps.length === 0) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Get the current number of tracked keys
   */
  get size(): number {
    return this.entries.size;
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Get the configuration for this rate limiter
   */
  get configSnapshot(): RateLimitConfig {
    return { ...this.config };
  }
}

/**
 * Pre-configured rate limiter for exports
 * Limits: 20 exports per hour (3,600,000 ms)
 */
export const exportRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
});

/**
 * Pre-configured rate limiter for general API requests
 * Limits: 100 requests per minute (60,000 ms)
 */
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});
