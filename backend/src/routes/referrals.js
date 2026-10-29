import express from 'express';
const router = express.Router();
import { getReferralStats, getReferralList, getReferralCode, generateReferralCode } from '../controllers/referralController.js';

router.get('/', getReferralList);
router.get('/stats', getReferralStats);
router.get('/list', getReferralList);
router.get('/code', getReferralCode);
router.post('/generate', generateReferralCode);

export default router;
