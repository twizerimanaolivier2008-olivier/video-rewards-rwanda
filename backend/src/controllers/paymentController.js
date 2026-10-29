import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';

export const initiateMoMoPayment = async (req, res) => {
  try {
    const { amount, phone_number } = req.body;
    const userId = req.user.id;

    const reference = 'VR-' + Date.now() + '-' + userId;

    await Transaction.create({
      user_id: userId,
      type: 'registration',
      amount: 4750,
      description: `MTN MoMo payment for registration`,
      status: 'pending'
    });

    res.json({
      message: 'Payment initiated successfully',
      reference,
      amount: 4750,
      currency: 'RWF',
      phone_number
    });
  } catch (error) {
    console.error('MoMo payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyMoMoPayment = async (req, res) => {
  try {
    const { reference, status } = req.body;
    const userId = req.user.id;

    if (status === 'SUCCESSFUL') {
      const transactions = await Transaction.findByUserIdAndType(userId, 'registration');
      const pendingTx = transactions.find(t => t.description.includes('MTN MoMo'));

      if (pendingTx) {
        await Transaction.updateStatus(pendingTx.id, 'completed');
      }

      await User.upgradeToPremium(userId);

      res.json({ message: 'Payment verified and account upgraded to premium', status: 'success' });
    } else {
      res.json({ message: 'Payment not completed', status: 'failed' });
    }
  } catch (error) {
    console.error('Verify MoMo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const initiateAirtelPayment = async (req, res) => {
  try {
    const { amount, phone_number } = req.body;
    const userId = req.user.id;

    const reference = 'VR-' + Date.now() + '-' + userId;

    await Transaction.create({
      user_id: userId,
      type: 'registration',
      amount: 4750,
      description: `Airtel Money payment for registration`,
      status: 'pending'
    });

    res.json({
      message: 'Payment initiated successfully',
      reference,
      amount: 4750,
      currency: 'RWF',
      phone_number
    });
  } catch (error) {
    console.error('Airtel payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyAirtelPayment = async (req, res) => {
  try {
    const { reference, status } = req.body;
    const userId = req.user.id;

    if (status === 'SUCCESSFUL') {
      const transactions = await Transaction.findByUserIdAndType(userId, 'registration');
      const pendingTx = transactions.find(t => t.description.includes('Airtel Money'));

      if (pendingTx) {
        await Transaction.updateStatus(pendingTx.id, 'completed');
      }

      await User.upgradeToPremium(userId);

      res.json({ message: 'Payment verified and account upgraded to premium', status: 'success' });
    } else {
      res.json({ message: 'Payment not completed', status: 'failed' });
    }
  } catch (error) {
    console.error('Verify Airtel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, payment_method, phone_number } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const minWithdrawal = 2000;
    if (amount < minWithdrawal) {
      return res.status(400).json({ message: `Minimum withdrawal amount is ${minWithdrawal} RWF` });
    }

    if (amount > user.balance) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const withdrawal = await Withdrawal.create({
      user_id: userId,
      amount,
      payment_method,
      phone_number,
      status: 'pending'
    });

    const camelCaseWithdrawal = {
      ...withdrawal,
      paymentMethod: withdrawal.payment_method,
      phoneNumber: withdrawal.phone_number,
      userId: withdrawal.user_id,
      createdAt: withdrawal.created_at,
      updatedAt: withdrawal.updated_at
    };

    await Transaction.create({
      user_id: userId,
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrawal request to ${phone_number} via ${payment_method}`,
      status: 'pending'
    });

    res.status(201).json({ message: 'Withdrawal request submitted successfully', withdrawal: camelCaseWithdrawal });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getWithdrawalHistory = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.findByUserId(req.user.id);
    const camelCased = withdrawals.map(w => ({
      ...w,
      paymentMethod: w.payment_method,
      phoneNumber: w.phone_number,
      userId: w.user_id,
      processedBy: w.processed_by,
      createdAt: w.created_at,
      updatedAt: w.updated_at
    }));
    res.json(camelCased);
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getWithdrawalMethods = async (req, res) => {
  try {
    res.json({
      methods: [
        { id: 'mtn_momo', name: 'MTN Mobile Money', icon: '🟡' },
        { id: 'airtel_money', name: 'Airtel Money', icon: '🔴' }
      ],
      minimum_withdrawal: 2000,
      currency: 'RWF'
    });
  } catch (error) {
    console.error('Get methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
