import express from 'express';
const router = express.Router();
import {
  initiateMoMoPayment,
  verifyMoMoPayment,
  initiateAirtelPayment,
  verifyAirtelPayment,
  requestWithdrawal,
  getWithdrawalHistory,
  getWithdrawalMethods,
} from '../controllers/paymentController.js';
import { rateLimit } from '../middleware/rateLimit.js';

router.post('/momo/initiate', rateLimit({ scope: 'payment:momo:initiate', limit: 5, windowSeconds: 300 }), initiateMoMoPayment);
router.post('/momo/verify', rateLimit({ scope: 'payment:momo:verify', limit: 10, windowSeconds: 300 }), verifyMoMoPayment);
router.post('/airtel/initiate', rateLimit({ scope: 'payment:airtel:initiate', limit: 5, windowSeconds: 300 }), initiateAirtelPayment);
router.post('/airtel/verify', rateLimit({ scope: 'payment:airtel:verify', limit: 10, windowSeconds: 300 }), verifyAirtelPayment);
router.post('/withdrawals', rateLimit({ scope: 'payment:withdrawal', limit: 5, windowSeconds: 3600 }), requestWithdrawal);
router.get('/withdrawals', getWithdrawalHistory);
router.get('/methods', getWithdrawalMethods);

export default router;
