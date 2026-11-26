import { createHmac } from 'node:crypto';
import pool from '../config/db.js';
import { getWindowStart } from '../utils/rateLimitWindow.js';
export { getWindowStart } from '../utils/rateLimitWindow.js';

const HASH_SECRET = process.env.RATE_LIMIT_HASH_SECRET || process.env.JWT_SECRET;
if (!HASH_SECRET || Buffer.byteLength(HASH_SECRET, 'utf8') < 32) {
  throw new Error('A strong RATE_LIMIT_HASH_SECRET or JWT_SECRET is required for rate limiting.');
}

export const hashClientIdentifier = (identifier) =>
  createHmac('sha256', HASH_SECRET).update(String(identifier || 'unknown')).digest('hex');

export const rateLimit = ({ scope, limit, windowSeconds = 60 }) => {
  if (!/^[a-z0-9:_-]{1,64}$/i.test(scope)) throw new Error('Invalid rate-limit scope.');
  if (!Number.isInteger(limit) || limit < 1) throw new Error('Rate-limit limit must be a positive integer.');
  if (!Number.isInteger(windowSeconds) || windowSeconds < 1) throw new Error('Rate-limit window must be positive.');

  return async (req, res, next) => {
    const now = Date.now();
    const windowStart = getWindowStart(now, windowSeconds);
    const windowEnd = windowStart + windowSeconds;
    // Trust X-Client-IP only when the API origin accepts requests exclusively from this Cloudflare edge proxy/Tunnel.\n    const clientIdentifier = req.get('X-Client-IP') || req.ip || req.socket?.remoteAddress || 'unknown';\n    const clientHash = hashClientIdentifier(clientIdentifier);

    try {
      await pool.query(
        `INSERT INTO api_rate_limits (scope, client_hash, window_start, request_count)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE request_count = request_count + 1`,
        [scope, clientHash, windowStart]
      );

      const [rows] = await pool.query(
        'SELECT request_count FROM api_rate_limits WHERE scope = ? AND client_hash = ? AND window_start = ? LIMIT 1',
        [scope, clientHash, windowStart]
      );
      const count = Number(rows[0]?.request_count || 0);
      if (count > limit) {
        res.setHeader('Retry-After', String(Math.max(1, Math.ceil((windowEnd - now) / 1000))));
        res.setHeader('RateLimit-Limit', String(limit));
        res.setHeader('RateLimit-Remaining', '0');
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }

      res.setHeader('RateLimit-Limit', String(limit));
      res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - count)));
      return next();
    } catch (error) {
      console.error('Rate limiter unavailable:', error.code || error.name || 'Error');
      return res.status(503).json({ error: 'This service is temporarily unavailable. Please try again.' });
    }
  };
};
