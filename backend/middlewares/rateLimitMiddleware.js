import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login, register, refresh-token).
 * Limits to 10 requests per minute per IP to prevent brute force and infinite loops.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after a minute.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use IP address as identifier (works behind proxies on HF Space)
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.ip || 
           req.connection?.remoteAddress || 
           'unknown';
  }
});

/**
 * Strict rate limiter for refresh-token endpoint only.
 * Limits to 5 requests per minute - should normally only be called once per token expiry.
 */
export const refreshTokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute (should be enough for legitimate use)
  message: {
    success: false,
    message: 'Too many token refresh attempts. Please wait a minute.',
    code: 'REFRESH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.ip || 
           req.connection?.remoteAddress || 
           'unknown';
  }
});

/**
 * General API rate limiter - more permissive.
 * Limits to 100 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Too many requests, please slow down.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.ip || 
           req.connection?.remoteAddress || 
           'unknown';
  }
});
