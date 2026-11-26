import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/auth.js';
import videoRoutes from './src/routes/videos.js';
import paymentRoutes from './src/routes/payments.js';
import referralRoutes from './src/routes/referrals.js';
import adminRoutes from './src/routes/admin.js';
import userRoutes from './src/routes/users.js';
import { authenticateUser } from './src/middleware/auth.js';
import pool from './src/config/db.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

const production = process.env.NODE_ENV === 'production';
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ALLOWED_ORIGINS || '').split(','),
].map((value) => String(value || '').trim()).filter(Boolean));

if (production && allowedOrigins.size === 0) {
  throw new Error('FRONTEND_URL or CORS_ALLOWED_ORIGINS must be configured in production.');
}

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
  if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin && !production) return callback(null, true);
    if (origin && allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  maxAge: 600,
}));

app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '32kb', parameterLimit: 100 }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', message: 'Video Rewards Rwanda API is ready' });
  } catch (error) {
    console.error('Health check database error:', error.code || error.name);
    res.status(503).json({
      status: 'error',
      database: 'unavailable',
      message: 'The API database is temporarily unavailable.',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/videos', authenticateUser, videoRoutes);
app.use('/api/payments', authenticateUser, paymentRoutes);
app.use('/api/referrals', authenticateUser, referralRoutes);
app.use('/api/users', authenticateUser, userRoutes);
app.use('/api/admin', authenticateUser, adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' });
  }
  console.error('Unhandled API error:', error.code || error.name || 'Error');
  return res.status(500).json({ error: 'Internal server error.' });
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Video Rewards Rwanda API listening on port ${PORT}`);
});
