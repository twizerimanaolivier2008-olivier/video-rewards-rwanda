import express from 'express';
const router = express.Router();
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';

router.post('/register', register);
router.post('/login', login);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
