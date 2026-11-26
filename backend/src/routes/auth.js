import express from 'express';
const router = express.Router();
import { register, login, getProfile } from '../controllers/authController.js';
import {
  changePassword,
  getProfilePhoto,
  requestProfileVerificationCodes,
  updateProfile,
  uploadProfileAvatar,
  verifyProfileEmail,
} from '../controllers/accountController.js';
import { authenticateUser } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/avatarUpload.js';
import { rateLimit } from '../middleware/rateLimit.js';

router.post('/register', rateLimit({ scope: 'auth:register', limit: 5, windowSeconds: 900 }), register);
router.post('/login', rateLimit({ scope: 'auth:login', limit: 8, windowSeconds: 900 }), login);
router.get('/profile-photo/:filename', getProfilePhoto);
router.get('/profile', authenticateUser, getProfile);
router.post('/profile/verification-code', authenticateUser, rateLimit({ scope: 'auth:profile-code', limit: 3, windowSeconds: 900 }), requestProfileVerificationCodes);
router.post('/profile/verify-email', authenticateUser, rateLimit({ scope: 'auth:email-verify', limit: 5, windowSeconds: 900 }), verifyProfileEmail);
router.put('/profile', authenticateUser, updateProfile);
router.put('/profile/password', authenticateUser, rateLimit({ scope: 'auth:password-change', limit: 5, windowSeconds: 900 }), changePassword);
router.put('/profile/avatar', authenticateUser, uploadAvatar, uploadProfileAvatar);

export default router;
