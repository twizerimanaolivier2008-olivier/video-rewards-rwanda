import pool from '../config/db.js';

export const cleanupExpiredRateLimits = async () => {
  const [rateLimits] = await pool.query(
    'DELETE FROM api_rate_limits WHERE window_start < ? LIMIT 10000',
    [Math.floor(Date.now() / 1000) - 86400]
  );
  const [idempotency] = await pool.query(
    'DELETE FROM idempotency_keys WHERE expires_at < CURRENT_TIMESTAMP LIMIT 10000'
  );
  return {
    rateLimitRowsRemoved: rateLimits.affectedRows,
    idempotencyRowsRemoved: idempotency.affectedRows,
  };
};
