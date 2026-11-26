import pool from '../config/db.js';
import Withdrawal from '../models/Withdrawal.js';

const PAYMENT_UNAVAILABLE = {
  error: 'Mobile-money payment initiation is temporarily disabled until server-to-server provider verification is configured.',
  code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
};

export const initiateMoMoPayment = async (req, res) =>
  res.status(503).json({ ...PAYMENT_UNAVAILABLE, provider: 'mtn_momo' });

export const verifyMoMoPayment = async (req, res) =>
  res.status(409).json({
    error: 'A client-submitted payment status is not proof of payment. Only authenticated MTN provider confirmation can complete a payment.',
    code: 'CLIENT_PAYMENT_STATUS_REJECTED',
  });

export const initiateAirtelPayment = async (req, res) =>
  res.status(503).json({ ...PAYMENT_UNAVAILABLE, provider: 'airtel_money' });

export const verifyAirtelPayment = async (req, res) =>
  res.status(409).json({
    error: 'A client-submitted payment status is not proof of payment. Only authenticated Airtel provider confirmation can complete a payment.',
    code: 'CLIENT_PAYMENT_STATUS_REJECTED',
  });

export const requestWithdrawal = async (req, res) => {
  const { amount, payment_method, phone_number } = req.body || {};
  const amountText = String(amount ?? '');
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(amountText)) {
    return res.status(400).json({ error: 'Enter a valid amount with at most two decimal places.' });
  }
  const normalizedAmount = Number(amountText);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 2000 || normalizedAmount > 10000000) {
    return res.status(400).json({ error: 'Withdrawal must be between 2,000 and 10,000,000 RWF.' });
  }
  if (!['mtn_momo', 'airtel_money'].includes(payment_method)) {
    return res.status(400).json({ error: 'Choose a supported withdrawal method.' });
  }
  const normalizedPhone = String(phone_number || '').trim();
  if (!/^[\d+()\s-]{7,20}$/.test(normalizedPhone)) {
    return res.status(400).json({ error: 'Enter a valid mobile-money phone number.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [debit] = await connection.query(
      'UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?',
      [amountText, req.user.id, amountText]
    );
    if (debit.affectedRows !== 1) {
      await connection.rollback();
      return res.status(400).json({ error: 'Insufficient available balance.' });
    }

    const [created] = await connection.query(
      `INSERT INTO withdrawals
       (user_id, amount, payment_method, phone_number, status, funds_reserved)
       VALUES (?, ?, ?, ?, 'pending', TRUE)`,
      [req.user.id, amountText, payment_method, normalizedPhone]
    );
    const withdrawalId = created.insertId;
    await connection.query(
      `INSERT INTO transactions
       (user_id, type, amount, description, status, payment_reference)
       VALUES (?, 'withdrawal', ?, ?, 'pending', ?)`,
      [
        req.user.id,
        -normalizedAmount,
        `Withdrawal request #${withdrawalId} via ${payment_method}`,
        `withdrawal:${withdrawalId}`,
      ]
    );
    const [rows] = await connection.query('SELECT * FROM withdrawals WHERE id = ?', [withdrawalId]);
    await connection.commit();
    const withdrawal = rows[0];
    return res.status(201).json({
      message: 'Withdrawal request submitted. Funds have been reserved while it is reviewed.',
      withdrawal: {
        ...withdrawal,
        paymentMethod: withdrawal.payment_method,
        phoneNumber: withdrawal.phone_number,
        userId: withdrawal.user_id,
        createdAt: withdrawal.created_at,
        updatedAt: withdrawal.updated_at,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Withdrawal request error:', error.code || error.name);
    return res.status(503).json({ error: 'Could not safely create the withdrawal request.' });
  } finally {
    connection.release();
  }
};

export const getWithdrawalHistory = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.findByUserId(req.user.id);
    const camelCased = withdrawals.map((w) => ({
      ...w,
      paymentMethod: w.payment_method,
      phoneNumber: w.phone_number,
      userId: w.user_id,
      processedBy: w.processed_by,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    }));
    res.json(camelCased);
  } catch (error) {
    console.error('Get withdrawals error:', error.code || error.name);
    res.status(500).json({ error: 'Could not retrieve withdrawal history.' });
  }
};

export const getWithdrawalMethods = async (req, res) => res.json({
  methods: [
    { id: 'mtn_momo', name: 'MTN Mobile Money', icon: '🟡' },
    { id: 'airtel_money', name: 'Airtel Money', icon: '🔴' },
  ],
  minimum_withdrawal: 2000,
  currency: 'RWF',
});
