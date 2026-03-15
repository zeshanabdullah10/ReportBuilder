/**
 * CSRF (Cross-Site Request Forgery) Protection
 *
 * Provides token generation and validation for protecting state-changing operations.
 * Uses HMAC-SHA256 for signing with timing-safe comparison to prevent timing attacks.
 */

import * as crypto from 'crypto';

/**
 * CSRF token configuration
 */
const CSRF_TOKEN_SEPARATOR = '.';
const CSRF_TOKEN_RANDOM_LENGTH = 32; // bytes
const CSRF_TOKEN_MAX_AGE = 60 * 60 * 1000; // 1 hour in milliseconds
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_BODY_FIELD_NAME = 'csrfToken';

/**
 * Get the CSRF secret from environment or use development default
 * In production, CSRF_SECRET must be set via environment variable
 */
function getCsrfSecret(): string {
  const secret = process.env.CSRF_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CSRF_SECRET environment variable must be set in production'
      );
    }
    // Development fallback - should not be used in production
    console.warn(
      'WARNING: Using development CSRF secret. Set CSRF_SECRET in production.'
    );
    return 'dev-csrf-secret-do-not-use-in-production';
  }

  return secret;
}

/**
 * Generate a cryptographically secure random string
 * @param length - Number of bytes to generate (will be hex-encoded, so 2x length)
 * @returns Hex-encoded random string
 */
function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Create an HMAC-SHA256 signature for the token payload
 * @param payload - The data to sign (randomValue.timestamp)
 * @param secret - The signing secret
 * @returns Hex-encoded signature
 */
function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Perform timing-safe comparison of two strings
 * Prevents timing attacks by always comparing the full length
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  // Handle different lengths by still comparing against padded values
  // This prevents leaking length information
  if (a.length !== b.length) {
    // Still perform a comparison to maintain constant time
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Generate a CSRF token with the format: randomValue.timestamp.signature
 *
 * The token structure:
 * - randomValue: 64-character hex string (32 bytes) for uniqueness
 * - timestamp: Unix timestamp in milliseconds for expiration
 * - signature: HMAC-SHA256 of "randomValue.timestamp" using CSRF_SECRET
 *
 * @returns CSRF token string
 */
export function generateCsrfToken(): string {
  const secret = getCsrfSecret();
  const randomValue = generateRandomString(CSRF_TOKEN_RANDOM_LENGTH);
  const timestamp = Date.now().toString();
  const payload = `${randomValue}${CSRF_TOKEN_SEPARATOR}${timestamp}`;
  const signature = signPayload(payload, secret);

  return `${payload}${CSRF_TOKEN_SEPARATOR}${signature}`;
}

/**
 * Validate a CSRF token
 *
 * Checks:
 * 1. Token format (three parts separated by dots)
 * 2. Token expiration (not older than CSRF_TOKEN_MAX_AGE)
 * 3. Signature validity (HMAC verification with timing-safe comparison)
 *
 * @param token - The CSRF token to validate
 * @returns Object with validation result and optional error message
 */
export function validateCsrfToken(token: string): {
  valid: boolean;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token is required' };
  }

  const parts = token.split(CSRF_TOKEN_SEPARATOR);

  if (parts.length !== 3) {
    return { valid: false, error: 'Invalid token format' };
  }

  const [randomValue, timestampStr, providedSignature] = parts;

  // Validate random value exists and has correct length
  if (!randomValue || randomValue.length !== CSRF_TOKEN_RANDOM_LENGTH * 2) {
    return { valid: false, error: 'Invalid token format' };
  }

  // Validate timestamp
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) {
    return { valid: false, error: 'Invalid timestamp' };
  }

  // Check token expiration
  const now = Date.now();
  const tokenAge = now - timestamp;

  if (tokenAge > CSRF_TOKEN_MAX_AGE) {
    return { valid: false, error: 'Token has expired' };
  }

  // Also reject tokens from the future (clock skew protection)
  if (timestamp > now + 60000) {
    // Allow 1 minute clock skew
    return { valid: false, error: 'Invalid timestamp' };
  }

  // Validate signature using timing-safe comparison
  const secret = getCsrfSecret();
  const payload = `${randomValue}${CSRF_TOKEN_SEPARATOR}${timestampStr}`;
  const expectedSignature = signPayload(payload, secret);

  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return { valid: false, error: 'Invalid signature' };
  }

  return { valid: true };
}

/**
 * Extract CSRF token from a request
 *
 * Checks in order:
 * 1. X-CSRF-Token header
 * 2. csrfToken field in request body
 *
 * @param request - The request object (Next.js API route request)
 * @returns The CSRF token or null if not found
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  // Check header first (preferred method)
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (headerToken) {
    return headerToken;
  }

  // Fall back to body field
  // Note: This requires the body to be parsed as JSON
  // In Next.js API routes, you may need to clone the request
  // if the body has already been consumed
  return null;
}

/**
 * Extract CSRF token from request body
 *
 * This is a helper for when the token is in the body
 * Requires the body to already be parsed
 *
 * @param body - The parsed request body
 * @returns The CSRF token or null if not found
 */
export function getCsrfTokenFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const bodyObj = body as Record<string, unknown>;

  if (CSRF_BODY_FIELD_NAME in bodyObj) {
    const token = bodyObj[CSRF_BODY_FIELD_NAME];
    return typeof token === 'string' ? token : null;
  }

  return null;
}

/**
 * Check if an HTTP method requires CSRF protection
 *
 * Safe methods (GET, HEAD, OPTIONS, TRACE) don't require CSRF protection
 * as they should be idempotent and not change state.
 *
 * @param method - The HTTP method
 * @returns True if CSRF validation is required
 */
export function requiresCsrfValidation(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];
  return !safeMethods.includes(method.toUpperCase());
}

/**
 * Full CSRF validation for API routes
 *
 * This function:
 * 1. Checks if the request method requires CSRF protection
 * 2. Extracts the token from header or body
 * 3. Validates the token
 *
 * @param request - The Next.js API route request
 * @param body - Optional parsed request body (for body token extraction)
 * @returns Object with validation result and optional error message
 */
export function validateCsrfForApiRoute(
  request: Request,
  body?: unknown
): { valid: boolean; error?: string } {
  const method = request.method || 'GET';

  // Check if CSRF validation is needed for this method
  if (!requiresCsrfValidation(method)) {
    return { valid: true };
  }

  // Extract token from header
  let token = getCsrfTokenFromRequest(request);

  // Fall back to body if header not found and body is provided
  if (!token && body !== undefined) {
    token = getCsrfTokenFromBody(body);
  }

  if (!token) {
    return {
      valid: false,
      error: 'CSRF token not found in request header or body',
    };
  }

  return validateCsrfToken(token);
}

/**
 * API route handler type
 */
export type ApiRouteHandler = (
  request: Request,
  context?: { params: Record<string, string | string[]> }
) => Promise<Response> | Response;

/**
 * Higher-order function to wrap API handlers with CSRF protection
 *
 * Automatically validates CSRF tokens for state-changing methods (POST, PUT, DELETE, PATCH).
 * Safe methods (GET, HEAD, OPTIONS) are passed through without validation.
 *
 * @example
 * ```typescript
 * // In app/api/templates/route.ts
 * import { withCsrfProtection } from '@/lib/security/csrf-middleware';
 *
 * async function handler(request: Request) {
 *   // Your handler logic
 *   return Response.json({ success: true });
 * }
 *
 * export const POST = withCsrfProtection(handler);
 * export const PUT = withCsrfProtection(handler);
 * export const DELETE = withCsrfProtection(handler);
 * ```
 *
 * @param handler - The API route handler to wrap
 * @returns Wrapped handler with CSRF protection
 */
export function withCsrfProtection(handler: ApiRouteHandler): ApiRouteHandler {
  return async (
    request: Request,
    context?: { params: Record<string, string | string[]> }
  ) => {
    const method = request.method || 'GET';

    // Only validate for state-changing methods
    if (!requiresCsrfValidation(method)) {
      return handler(request, context);
    }

    // Try to get token from header first
    let token = getCsrfTokenFromRequest(request);

    // If no header token, try to get from body
    if (!token) {
      try {
        // Clone the request so we can read the body without consuming it
        const clonedRequest = request.clone();
        const body = await clonedRequest.json();
        token = getCsrfTokenFromBody(body);
      } catch {
        // Body parsing failed, token remains null
      }
    }

    if (!token) {
      return Response.json(
        {
          error: 'CSRF token missing',
          message: 'CSRF token is required for this request',
        },
        { status: 403 }
      );
    }

    const validation = validateCsrfToken(token);

    if (!validation.valid) {
      return Response.json(
        {
          error: 'CSRF validation failed',
          message: validation.error,
        },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Get the CSRF header name for client-side use
 */
export const CSRF_HEADER = CSRF_HEADER_NAME;

/**
 * Get the CSRF body field name for client-side use
 */
export const CSRF_BODY_FIELD = CSRF_BODY_FIELD_NAME;

/**
 * Get the maximum token age in milliseconds
 */
export const CSRF_MAX_AGE = CSRF_TOKEN_MAX_AGE;
