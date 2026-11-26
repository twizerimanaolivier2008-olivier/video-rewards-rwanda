import mysql from 'mysql2/promise';

const production = process.env.NODE_ENV === 'production';
const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
if (production) {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required production database settings: ${missing.join(', ')}`);
  }
  if (process.env.DB_USER === 'root') {
    throw new Error('Production database must use a dedicated least-privilege user, not root.');
  }
}

const ssl = process.env.DB_SSL === 'true'
  ? {
      rejectUnauthorized: true,
      ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {}),
    }
  : undefined;

if (production && process.env.DB_SSL !== 'true') {
  throw new Error('DB_SSL=true is required for production database connections.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'video_rewards_rwanda',
  ...(ssl ? { ssl } : {}),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 100,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000,
});

export default pool;
