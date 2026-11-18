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

router.post('/register', register);
router.post('/login', login);
router.get('/profile-photo/:filename', getProfilePhoto);
router.get('/profile', authenticateUser, getProfile);
router.post('/profile/verification-code', authenticateUser, requestProfileVerificationCodes);
router.post('/profile/verify-email', authenticateUser, verifyProfileEmail);
router.put('/profile', authenticateUser, updateProfile);
router.put('/profile/password', authenticateUser, changePassword);
router.put('/profile/avatar', authenticateUser, uploadAvatar, uploadProfileAvatar);

export default router;
