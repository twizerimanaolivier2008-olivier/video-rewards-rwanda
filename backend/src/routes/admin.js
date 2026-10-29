import express from 'express';
const router = express.Router();
import {
  getAllUsers, createUser, updateUser, deleteUser, toggleUserStatus,
  getAllVideos, getVideoStats, createVideo, updateVideo, deleteVideo,
  getAllWithdrawals, processWithdrawal, getPlatformStats,
  getAllCompanies, createCompany, updateCompany, deleteCompany
} from '../controllers/adminController.js';
import { authenticateUser } from '../middleware/auth.js';
import { admin as adminOnly } from '../middleware/admin.js';

router.use(authenticateUser, adminOnly);

router.get('/stats', getPlatformStats);

// User management
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/status', toggleUserStatus);

// Video management
router.get('/videos/stats', getVideoStats);
router.get('/videos', getAllVideos);
router.post('/videos', createVideo);
router.put('/videos/:id', updateVideo);
router.delete('/videos/:id', deleteVideo);

// Withdrawal management
router.get('/withdrawals', getAllWithdrawals);
router.put('/withdrawals/:id', processWithdrawal);

// Company management
router.get('/companies', getAllCompanies);
router.post('/companies', createCompany);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

export default router;
