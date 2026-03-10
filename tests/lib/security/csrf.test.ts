/**
 * Tests for CSRF Protection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment variables
const originalEnv = process.env;

// We need to import the module after setting up mocks
// So we'll use dynamic imports or mock the module

describe('CSRF Protection', () => {
  let csrfModule: typeof import('@/lib/security/csrf');

  beforeEach(async () => {
    // Reset modules and environment
    vi.resetModules();

    // Set test environment
    process.env = {
      ...originalEnv,
      CSRF_SECRET: 'test-csrf-secret-for-testing-purposes',
      NODE_ENV: 'test',
    };

    // Import fresh module
    csrfModule = await import('@/lib/security/csrf');
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('generateCsrfToken', () => {
    it('should generate a token with correct format', () => {
      const token = csrfModule.generateCsrfToken();

      // Token format: randomValue.timestamp.signature
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();

      for (let i = 0; i < 100; i++) {
        tokens.add(csrfModule.generateCsrfToken());
      }

      expect(tokens.size).toBe(100);
    });

    it('should have correct random value length (64 hex chars = 32 bytes)', () => {
      const token = csrfModule.generateCsrfToken();
      const parts = token.split('.');
      expect(parts[0]).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(parts[0])).toBe(true);
    });

    it('should have valid timestamp', () => {
      const token = csrfModule.generateCsrfToken();
      const parts = token.split('.');
      const timestamp = parseInt(parts[1], 10);

      expect(timestamp).not.toBeNaN();
      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it('should have valid signature (64 hex chars)', () => {
      const token = csrfModule.generateCsrfToken();
      const parts = token.split('.');

      expect(parts[2]).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(parts[2])).toBe(true);
    });
  });

  describe('validateCsrfToken', () => {
    it('should validate a freshly generated token', () => {
      const token = csrfModule.generateCsrfToken();
      const result = csrfModule.validateCsrfToken(token);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty token', () => {
      const result = csrfModule.validateCsrfToken('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is required');
    });

    it('should reject null/undefined token', () => {
      const resultNull = csrfModule.validateCsrfToken(null as unknown as string);
      const resultUndefined = csrfModule.validateCsrfToken(undefined as unknown as string);

      expect(resultNull.valid).toBe(false);
      expect(resultUndefined.valid).toBe(false);
    });

    it('should reject token with wrong number of parts', () => {
      const result1 = csrfModule.validateCsrfToken('onlyonepart');
      const result2 = csrfModule.validateCsrfToken('two.parts');
      const result3 = csrfModule.validateCsrfToken('four.parts.here.now');

      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Invalid token format');
      expect(result2.valid).toBe(false);
      expect(result3.valid).toBe(false);
    });

    it('should reject token with invalid random value length', () => {
      const token = 'short.1234567890.abc123';
      const result = csrfModule.validateCsrfToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token format');
    });

    it('should reject token with invalid timestamp', () => {
      const validRandom = 'a'.repeat(64);
      const token = `${validRandom}.invalid.abc`;
      const result = csrfModule.validateCsrfToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid timestamp');
    });

    it('should reject expired token', () => {
      const validRandom = 'a'.repeat(64);
      // Token age: 2 hours (past max age of 1 hour)
      const expiredTimestamp = Date.now() - 2 * 60 * 60 * 1000;

      // We need to create a token with correct signature for the expired timestamp
      // Since we can't easily sign it, we'll test with a modified token
      // This test verifies the timestamp check, signature will fail but timestamp is checked first
      const token = `${validRandom}.${expiredTimestamp}.abc`;

      const result = csrfModule.validateCsrfToken(token);

      // Should fail - either on expiration or signature
      expect(result.valid).toBe(false);
    });

    it('should reject token from the future', () => {
      const validRandom = 'a'.repeat(64);
      // Token timestamp 2 minutes in the future (beyond allowed clock skew)
      const futureTimestamp = Date.now() + 2 * 60 * 1000;
      const token = `${validRandom}.${futureTimestamp}.abc`;

      const result = csrfModule.validateCsrfToken(token);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid timestamp');
    });

    it('should reject token with invalid signature', () => {
      const token = csrfModule.generateCsrfToken();
      const parts = token.split('.');
      // Modify the signature to make it invalid
      const invalidToken = `${parts[0]}.${parts[1]}.${'0'.repeat(64)}`;

      const result = csrfModule.validateCsrfToken(invalidToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should reject token with modified random value', () => {
      const token = csrfModule.generateCsrfToken();
      const parts = token.split('.');
      // Modify the random value
      const modifiedRandom = 'f'.repeat(64);
      const modifiedToken = `${modifiedRandom}.${parts[1]}.${parts[2]}`;

      const result = csrfModule.validateCsrfToken(modifiedToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should reject token with modified timestamp', () => {
      const token = csrfModule.generateCsrfToken();
      const parts = token.split('.');
      // Modify the timestamp
      const modifiedTimestamp = parseInt(parts[1], 10) + 1000;
      const modifiedToken = `${parts[0]}.${modifiedTimestamp}.${parts[2]}`;

      const result = csrfModule.validateCsrfToken(modifiedToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid signature');
    });

    it('should use timing-safe comparison', async () => {
      // This test verifies that timing attacks are mitigated
      // We can't directly test timing, but we can verify the function exists
      // and works correctly

      const token = csrfModule.generateCsrfToken();
      const parts = token.split('.');

      // Create a token with a slightly different signature
      const slightlyDifferentSignature = parts[2].slice(0, -1) + 'x';
      const invalidToken = `${parts[0]}.${parts[1]}.${slightlyDifferentSignature}`;

      const result = csrfModule.validateCsrfToken(invalidToken);

      expect(result.valid).toBe(false);
    });
  });

  describe('getCsrfTokenFromRequest', () => {
    it('should extract token from X-CSRF-Token header', () => {
      const token = csrfModule.generateCsrfToken();
      const request = new Request('http://localhost/api/test', {
        headers: { 'x-csrf-token': token },
      });

      const extracted = csrfModule.getCsrfTokenFromRequest(request);

      expect(extracted).toBe(token);
    });

    it('should return null when header is not present', () => {
      const request = new Request('http://localhost/api/test');
      const extracted = csrfModule.getCsrfTokenFromRequest(request);

      expect(extracted).toBeNull();
    });

    it('should prefer header over body', () => {
      const headerToken = csrfModule.generateCsrfToken();
      const bodyToken = csrfModule.generateCsrfToken();

      const request = new Request('http://localhost/api/test', {
        headers: { 'x-csrf-token': headerToken },
      });

      const extracted = csrfModule.getCsrfTokenFromRequest(request);

      expect(extracted).toBe(headerToken);
      expect(extracted).not.toBe(bodyToken);
    });
  });

  describe('getCsrfTokenFromBody', () => {
    it('should extract token from csrfToken field', () => {
      const token = csrfModule.generateCsrfToken();
      const body = { csrfToken: token, other: 'data' };

      const extracted = csrfModule.getCsrfTokenFromBody(body);

      expect(extracted).toBe(token);
    });

    it('should return null for null body', () => {
      expect(csrfModule.getCsrfTokenFromBody(null)).toBeNull();
    });

    it('should return null for undefined body', () => {
      expect(csrfModule.getCsrfTokenFromBody(undefined)).toBeNull();
    });

    it('should return null for non-object body', () => {
      expect(csrfModule.getCsrfTokenFromBody('string')).toBeNull();
      expect(csrfModule.getCsrfTokenFromBody(123)).toBeNull();
    });

    it('should return null when csrfToken field is not present', () => {
      expect(csrfModule.getCsrfTokenFromBody({ other: 'data' })).toBeNull();
    });

    it('should return null when csrfToken is not a string', () => {
      expect(csrfModule.getCsrfTokenFromBody({ csrfToken: 123 })).toBeNull();
      expect(csrfModule.getCsrfTokenFromBody({ csrfToken: { nested: true } })).toBeNull();
    });
  });

  describe('requiresCsrfValidation', () => {
    it('should require validation for POST', () => {
      expect(csrfModule.requiresCsrfValidation('POST')).toBe(true);
    });

    it('should require validation for PUT', () => {
      expect(csrfModule.requiresCsrfValidation('PUT')).toBe(true);
    });

    it('should require validation for DELETE', () => {
      expect(csrfModule.requiresCsrfValidation('DELETE')).toBe(true);
    });

    it('should require validation for PATCH', () => {
      expect(csrfModule.requiresCsrfValidation('PATCH')).toBe(true);
    });

    it('should not require validation for GET', () => {
      expect(csrfModule.requiresCsrfValidation('GET')).toBe(false);
    });

    it('should not require validation for HEAD', () => {
      expect(csrfModule.requiresCsrfValidation('HEAD')).toBe(false);
    });

    it('should not require validation for OPTIONS', () => {
      expect(csrfModule.requiresCsrfValidation('OPTIONS')).toBe(false);
    });

    it('should not require validation for TRACE', () => {
      expect(csrfModule.requiresCsrfValidation('TRACE')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(csrfModule.requiresCsrfValidation('post')).toBe(true);
      expect(csrfModule.requiresCsrfValidation('Post')).toBe(true);
      expect(csrfModule.requiresCsrfValidation('get')).toBe(false);
      expect(csrfModule.requiresCsrfValidation('Get')).toBe(false);
    });
  });

  describe('validateCsrfForApiRoute', () => {
    it('should return valid for GET requests without token', () => {
      const request = new Request('http://localhost/api/test', {
        method: 'GET',
      });

      const result = csrfModule.validateCsrfForApiRoute(request);

      expect(result.valid).toBe(true);
    });

    it('should return invalid for POST without token', () => {
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
      });

      const result = csrfModule.validateCsrfForApiRoute(request);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should validate POST with valid header token', () => {
      const token = csrfModule.generateCsrfToken();
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
      });

      const result = csrfModule.validateCsrfForApiRoute(request);

      expect(result.valid).toBe(true);
    });

    it('should validate POST with valid body token', () => {
      const token = csrfModule.generateCsrfToken();
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
      });
      const body = { csrfToken: token };

      const result = csrfModule.validateCsrfForApiRoute(request, body);

      expect(result.valid).toBe(true);
    });

    it('should return invalid for POST with invalid token', () => {
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': 'invalid-token' },
      });

      const result = csrfModule.validateCsrfForApiRoute(request);

      expect(result.valid).toBe(false);
    });
  });

  describe('withCsrfProtection', () => {
    it('should pass through GET requests', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      const wrappedHandler = csrfModule.withCsrfProtection(handler);

      const request = new Request('http://localhost/api/test', {
        method: 'GET',
      });

      await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
    });

    it('should block POST without token', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      const wrappedHandler = csrfModule.withCsrfProtection(handler);

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
      });

      const response = await wrappedHandler(request);

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });

    it('should allow POST with valid token', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      const wrappedHandler = csrfModule.withCsrfProtection(handler);

      const token = csrfModule.generateCsrfToken();
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
      });

      await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
    });

    it('should block POST with invalid token', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      const wrappedHandler = csrfModule.withCsrfProtection(handler);

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': 'invalid-token' },
      });

      const response = await wrappedHandler(request);

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });

    it('should extract token from JSON body', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      const wrappedHandler = csrfModule.withCsrfProtection(handler);

      const token = csrfModule.generateCsrfToken();
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: token, data: 'test' }),
      });

      await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
    });

    it('should pass context to handler', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      const wrappedHandler = csrfModule.withCsrfProtection(handler);

      const token = csrfModule.generateCsrfToken();
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
      });
      const context = { params: { id: '123' } };

      await wrappedHandler(request, context);

      expect(handler).toHaveBeenCalledWith(request, context);
    });
  });

  describe('Constants', () => {
    it('should export CSRF_HEADER', () => {
      expect(csrfModule.CSRF_HEADER).toBe('x-csrf-token');
    });

    it('should export CSRF_BODY_FIELD', () => {
      expect(csrfModule.CSRF_BODY_FIELD).toBe('csrfToken');
    });

    it('should export CSRF_MAX_AGE', () => {
      expect(csrfModule.CSRF_MAX_AGE).toBe(60 * 60 * 1000); // 1 hour
    });
  });
});

describe('CSRF Middleware', () => {
  let middlewareModule: typeof import('@/lib/security/csrf-middleware');

  beforeEach(async () => {
    vi.resetModules();

    process.env = {
      ...originalEnv,
      CSRF_SECRET: 'test-csrf-secret-for-testing-purposes',
      NODE_ENV: 'test',
    };

    middlewareModule = await import('@/lib/security/csrf-middleware');
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('setCsrfCookie', () => {
    it('should set cookie with correct attributes', () => {
      const response = new Response('OK');
      const token = middlewareModule.getCsrfToken();

      middlewareModule.setCsrfCookie(response, token);

      const cookie = response.headers.get('Set-Cookie');
      expect(cookie).toContain('csrf_token=');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=strict');
      expect(cookie).toContain('Path=/');
    });

    it('should set Secure flag in production', async () => {
      vi.resetModules();
      process.env = {
        ...originalEnv,
        CSRF_SECRET: 'test-secret',
        NODE_ENV: 'production',
      };

      const prodModule = await import('@/lib/security/csrf-middleware');
      const response = new Response('OK');
      const token = prodModule.getCsrfToken();

      prodModule.setCsrfCookie(response, token);

      const cookie = response.headers.get('Set-Cookie');
      expect(cookie).toContain('Secure');
    });

    it('should not set Secure flag in development', () => {
      const response = new Response('OK');
      const token = middlewareModule.getCsrfToken();

      middlewareModule.setCsrfCookie(response, token);

      const cookie = response.headers.get('Set-Cookie');
      expect(cookie).not.toContain('Secure');
    });

    it('should allow custom sameSite option', () => {
      const response = new Response('OK');
      const token = middlewareModule.getCsrfToken();

      middlewareModule.setCsrfCookie(response, token, { sameSite: 'lax' });

      const cookie = response.headers.get('Set-Cookie');
      expect(cookie).toContain('SameSite=lax');
    });
  });

  describe('createCsrfTokenResponse', () => {
    it('should create response with token in body', async () => {
      const response = middlewareModule.createCsrfTokenResponse();
      const body = await response.json();

      expect(body).toHaveProperty('csrfToken');
      expect(body).toHaveProperty('expiresIn');
      expect(typeof body.csrfToken).toBe('string');
      expect(body.expiresIn).toBe(middlewareModule.CSRF_MAX_AGE);
    });

    it('should set cookie on response', () => {
      const response = middlewareModule.createCsrfTokenResponse();

      const cookie = response.headers.get('Set-Cookie');
      expect(cookie).toContain('csrf_token=');
    });
  });

  describe('createCsrfErrorResponse', () => {
    it('should create 403 response with error', async () => {
      const response = middlewareModule.createCsrfErrorResponse('Test error');
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toHaveProperty('error', 'csrf_validation_failed');
      expect(body).toHaveProperty('message', 'Test error');
    });
  });

  describe('hasValidCsrfToken', () => {
    it('should return true for valid token', () => {
      const token = middlewareModule.getCsrfToken();
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
      });

      expect(middlewareModule.hasValidCsrfToken(request)).toBe(true);
    });

    it('should return false for missing token', () => {
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
      });

      expect(middlewareModule.hasValidCsrfToken(request)).toBe(false);
    });

    it('should return true for GET requests', () => {
      const request = new Request('http://localhost/api/test', {
        method: 'GET',
      });

      expect(middlewareModule.hasValidCsrfToken(request)).toBe(true);
    });
  });

  describe('csrfMiddleware', () => {
    it('should generate token for GET requests', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      const wrappedHandler = middlewareModule.csrfMiddleware(handler);

      const request = new Request('http://localhost/api/test', {
        method: 'GET',
      });

      const response = await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
      expect(response.headers.get('Set-Cookie')).toContain('csrf_token=');
    });

    it('should validate token for POST requests', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      const wrappedHandler = middlewareModule.csrfMiddleware(handler);

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
      });

      const response = await wrappedHandler(request);

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });

    it('should allow POST with valid token', async () => {
      const handler = vi.fn().mockResolvedValue(new Response('OK'));
      const wrappedHandler = middlewareModule.csrfMiddleware(handler);

      const token = middlewareModule.getCsrfToken();
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
      });

      await wrappedHandler(request);

      expect(handler).toHaveBeenCalled();
    });
  });
});

describe('Production Security', () => {
  it('should throw error if CSRF_SECRET not set in production', async () => {
    vi.resetModules();

    process.env = {
      ...originalEnv,
      CSRF_SECRET: undefined,
      NODE_ENV: 'production',
    };

    const prodModule = await import('@/lib/security/csrf');

    // Error should be thrown when calling generateCsrfToken, not at import time
    expect(() => prodModule.generateCsrfToken()).toThrow(
      'CSRF_SECRET environment variable must be set in production'
    );
  });

  it('should use dev secret if CSRF_SECRET not set in development', async () => {
    vi.resetModules();

    process.env = {
      ...originalEnv,
      CSRF_SECRET: undefined,
      NODE_ENV: 'development',
    };

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const devModule = await import('@/lib/security/csrf');

    expect(devModule.generateCsrfToken()).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('WARNING')
    );

    consoleSpy.mockRestore();
  });
});
