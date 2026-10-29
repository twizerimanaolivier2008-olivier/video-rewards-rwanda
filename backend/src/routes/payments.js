import express from 'express';
const router = express.Router();
import { initiateMoMoPayment, verifyMoMoPayment, initiateAirtelPayment, verifyAirtelPayment, requestWithdrawal, getWithdrawalHistory, getWithdrawalMethods } from '../controllers/paymentController.js';

router.post('/momo/initiate', initiateMoMoPayment);
router.post('/momo/verify', verifyMoMoPayment);
router.post('/airtel/initiate', initiateAirtelPayment);
router.post('/airtel/verify', verifyAirtelPayment);
router.post('/withdrawals', requestWithdrawal);
router.get('/withdrawals', getWithdrawalHistory);
router.get('/methods', getWithdrawalMethods);

export default router;
