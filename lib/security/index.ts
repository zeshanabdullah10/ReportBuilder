/**
 * Security Utilities
 *
 * Barrel export for all security-related utilities.
 * Provides clean import paths for security functions and types.
 *
 * @example
 * ```typescript
 * import {
 *   generateCsrfToken,
 *   validateCsrfToken,
 *   exportRateLimiter,
 *   safeEvaluate
 * } from '@/lib/security';
 * ```
 */

// Rate limiting
export {
  RateLimiter,
  exportRateLimiter,
  apiRateLimiter,
} from './rate-limit';
export type {
  RateLimitConfig,
  RateLimitResult,
} from './rate-limit';

// CSRF protection
export {
  generateCsrfToken,
  validateCsrfToken,
  getCsrfTokenFromRequest,
  getCsrfTokenFromBody,
  requiresCsrfValidation,
  validateCsrfForApiRoute,
  CSRF_HEADER,
  CSRF_BODY_FIELD,
  CSRF_MAX_AGE,
} from './csrf';
export type {
  ApiRouteHandler,
} from './csrf';

// CSRF middleware
export {
  validateCsrfForApiRoute,
  withCsrfProtection,
  createCsrfTokenResponse,
  getCsrfToken,
  validateToken,
  validateRequest,
  shouldValidate,
  extractTokenFromHeader,
  extractTokenFromBody,
  setCsrfCookie,
  createCsrfErrorResponse,
  csrfMiddleware,
  hasValidCsrfToken,
  CSRF_COOKIE_NAME,
} from './csrf-middleware';

// Safe evaluation
export {
  safeEvaluate,
} from './safe-eval';
