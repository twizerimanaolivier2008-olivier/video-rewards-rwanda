import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactions = await Transaction.findByUserId(req.user.id, 100);
    const withdrawals = await Transaction.findByUserIdAndType(req.user.id, 'withdrawal');

    const totalWithdrawn = withdrawals
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    res.json({
      pointsBalance: user.points,
      accountBalance: user.balance,
      totalEarned: user.total_earned,
      totalWithdrawn: totalWithdrawn,
      accountType: user.account_type
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/balance', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      balance: user.balance,
      points: user.points,
      totalEarned: user.total_earned,
      totalWithdrawn: user.total_withdrawn
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.findByUserId(req.user.id);
    res.json(transactions);
  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
