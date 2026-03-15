/**
 * CSRF Middleware for API Routes
 *
 * Provides convenience functions and middleware for integrating CSRF protection
 * into Next.js API routes.
 *
 * @example
 * ```typescript
 * // app/api/templates/route.ts
 * import {
 *   withCsrfProtection,
 *   getCsrfToken,
 *   setCsrfCookie
 * } from '@/lib/security/csrf-middleware';
 *
 * // GET endpoint to fetch a CSRF token
 * export async function GET(request: Request) {
 *   const token = getCsrfToken();
 *   const response = Response.json({ csrfToken: token });
 *   setCsrfCookie(response, token);
 *   return response;
 * }
 *
 * // Protected POST endpoint
 * export const POST = withCsrfProtection(async (request: Request) => {
 *   // Handler is only reached if CSRF validation passes
 *   return Response.json({ success: true });
 * });
 * ```
 */

import {
  generateCsrfToken,
  validateCsrfToken,
  validateCsrfForApiRoute,
  withCsrfProtection as baseWithCsrfProtection,
  requiresCsrfValidation,
  getCsrfTokenFromRequest,
  getCsrfTokenFromBody,
  CSRF_HEADER,
  CSRF_BODY_FIELD,
  CSRF_MAX_AGE,
  type ApiRouteHandler,
} from './csrf';

// Re-export types and functions
export type { ApiRouteHandler } from './csrf';
export {
  CSRF_HEADER,
  CSRF_BODY_FIELD,
  CSRF_MAX_AGE,
  validateCsrfForApiRoute,
};

/**
 * Generate a new CSRF token
 * Convenience export for use in API routes
 */
export const getCsrfToken = generateCsrfToken;

/**
 * Validate a CSRF token string
 */
export const validateToken = validateCsrfToken;

/**
 * Full validation for API routes
 */
export const validateRequest = validateCsrfForApiRoute;

/**
 * Check if method requires CSRF validation
 */
export const shouldValidate = requiresCsrfValidation;

/**
 * Extract token from request header
 */
export const extractTokenFromHeader = getCsrfTokenFromRequest;

/**
 * Extract token from request body
 */
export const extractTokenFromBody = getCsrfTokenFromBody;

/**
 * Higher-order function to wrap API handlers with CSRF protection
 */
export const withCsrfProtection = baseWithCsrfProtection;

/**
 * Cookie name for CSRF token
 */
export const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Set CSRF token as an HTTP-only cookie on the response
 *
 * Note: For double-submit cookie pattern, the cookie should be set
 * and the client should read it and send it back in the header.
 *
 * @param response - The Response object to modify
 * @param token - The CSRF token to set
 * @param options - Cookie options
 */
export function setCsrfCookie(
  response: Response,
  token: string,
  options?: {
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    domain?: string;
  }
): void {
  const {
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'strict',
    path = '/',
    domain,
  } = options || {};

  const cookieParts = [
    `${CSRF_COOKIE_NAME}=${token}`,
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Path=${path}`,
    `Max-Age=${Math.floor(CSRF_MAX_AGE / 1000)}`,
  ];

  if (secure) {
    cookieParts.push('Secure');
  }

  if (domain) {
    cookieParts.push(`Domain=${domain}`);
  }

  response.headers.append('Set-Cookie', cookieParts.join('; '));
}

/**
 * Create a CSRF token response with the token in both body and cookie
 *
 * This is a convenience function for creating a standard CSRF token endpoint.
 *
 * @example
 * ```typescript
 * // app/api/csrf-token/route.ts
 * import { createCsrfTokenResponse } from '@/lib/security/csrf-middleware';
 *
 * export function GET() {
 *   return createCsrfTokenResponse();
 * }
 * ```
 */
export function createCsrfTokenResponse(): Response {
  const token = generateCsrfToken();
  const response = Response.json({
    csrfToken: token,
    expiresIn: CSRF_MAX_AGE,
  });

  setCsrfCookie(response, token);

  return response;
}

/**
 * Create a CSRF validation error response
 *
 * @param message - Error message
 * @returns JSON response with 403 status
 */
export function createCsrfErrorResponse(message: string): Response {
  return Response.json(
    {
      error: 'csrf_validation_failed',
      message,
    },
    { status: 403 }
  );
}

/**
 * Middleware that provides both token generation and validation
 *
 * For GET requests: generates and returns a new CSRF token
 * For state-changing requests: validates the CSRF token
 *
 * @example
 * ```typescript
 * // app/api/protected/route.ts
 * import { csrfMiddleware } from '@/lib/security/csrf-middleware';
 *
 * export const GET = csrfMiddleware(async (request: Request) => {
 *   // This is called after CSRF validation (or for GET, no validation needed)
 *   // request.csrfToken contains the token if available
 *   return Response.json({ data: 'protected data' });
 * });
 * ```
 */
export function csrfMiddleware(handler: ApiRouteHandler): ApiRouteHandler {
  return async (
    request: Request,
    context?: { params: Record<string, string | string[]> }
  ) => {
    const method = request.method || 'GET';

    // For GET requests, generate a new token and attach to request
    if (method === 'GET') {
      const token = generateCsrfToken();

      // Extend request with csrfToken (using a custom property)
      const extendedRequest = Object.assign(request, {
        csrfToken: token,
      });

      const response = await handler(extendedRequest, context);
      setCsrfCookie(response, token);

      return response;
    }

    // For other methods, validate CSRF
    if (requiresCsrfValidation(method)) {
      let token = getCsrfTokenFromRequest(request);

      if (!token) {
        try {
          const clonedRequest = request.clone();
          const body = await clonedRequest.json();
          token = getCsrfTokenFromBody(body);
        } catch {
          // Body parsing failed
        }
      }

      if (!token) {
        return createCsrfErrorResponse('CSRF token missing');
      }

      const validation = validateCsrfToken(token);

      if (!validation.valid) {
        return createCsrfErrorResponse(validation.error || 'Invalid CSRF token');
      }

      // Attach validated token to request
      const extendedRequest = Object.assign(request, {
        csrfToken: token,
      });

      return handler(extendedRequest, context);
    }

    // Safe methods pass through
    return handler(request, context);
  };
}

/**
 * Utility to check if a request has a valid CSRF token
 * without returning an error response
 *
 * Useful for conditional logic within handlers
 *
 * @param request - The request to check
 * @param body - Optional parsed body
 * @returns True if the request has a valid CSRF token
 */
export function hasValidCsrfToken(
  request: Request,
  body?: unknown
): boolean {
  const validation = validateCsrfForApiRoute(request, body);
  return validation.valid;
}
