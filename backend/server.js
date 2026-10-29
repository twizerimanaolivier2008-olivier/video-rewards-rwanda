import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import videoRoutes from './src/routes/videos.js';
import paymentRoutes from './src/routes/payments.js';
import referralRoutes from './src/routes/referrals.js';
import adminRoutes from './src/routes/admin.js';
import userRoutes from './src/routes/users.js';
import { authenticateUser } from './src/middleware/auth.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Video Rewards Rwanda API is running' });
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
