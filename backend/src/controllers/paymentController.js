import pool from '../config/db.js';
import { createHash } from 'node:crypto';
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
  const idempotencyKey = String(req.get('Idempotency-Key') || '');
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
    return res.status(400).json({ error: 'A unique Idempotency-Key header (16-128 characters) is required.' });
  }
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(amountText)) {
    return res.status(400).json({ error: 'Enter a valid amount with at most two decimal places.' });
  }
  const normalizedAmount = Number(amountText);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 2000 || normalizedAmount > 10000000) {
    return res.status(400).json({ error: 'Withdrawal must be between 2,000 and 10,000,000 RWF.' });
  }
  if (!['mtn_momo', 'airtel_money'].includes(payment_method)) {
    return res.status(400).json({ error: 'Choose MTN Mobile Money or Airtel Money.' });
  }
  const normalizedPhone = String(phone_number || '').trim();
  if (!/^[\d+()\s-]{7,20}$/.test(normalizedPhone)) {
    return res.status(400).json({ error: 'Enter a valid mobile-money phone number.' });
  }

  const principalId = String(req.user.id);
  const routeKey = 'payments:withdrawal';
  const keyHash = createHash('sha256').update(idempotencyKey).digest('hex');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [saved] = await connection.query(
      `SELECT response_status, response_json
       FROM idempotency_keys
       WHERE principal_id = ? AND route_key = ? AND key_hash = ?
         AND expires_at > CURRENT_TIMESTAMP
       FOR UPDATE`,
      [principalId, routeKey, keyHash]
    );
    if (saved.length) {
      const body = saved[0].response_json;
      await connection.rollback();
      if (!body) return res.status(409).json({ error: 'A request with this Idempotency-Key is still being processed.' });
      const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
      return res.status(Number(saved[0].response_status) || 201).json(responseBody);
    }

    await connection.query(
      `INSERT INTO idempotency_keys
       (principal_id, route_key, key_hash, expires_at)
       VALUES (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 48 HOUR))`,
      [principalId, routeKey, keyHash]
    );

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
        `-${amountText}`,
        `Withdrawal request #${withdrawalId} via ${payment_method}`,
        `withdrawal:${withdrawalId}`,
      ]
    );

    const responseBody = {
      message: 'Withdrawal request submitted. Funds have been reserved while it is reviewed.',
      withdrawal: {
        id: withdrawalId,
        amount: amountText,
        paymentMethod: payment_method,
        status: 'pending',
      },
    };
    await connection.query(
      `UPDATE idempotency_keys
       SET response_status = 201, response_json = ?
       WHERE principal_id = ? AND route_key = ? AND key_hash = ?`,
      [JSON.stringify(responseBody), principalId, routeKey, keyHash]
    );
    await connection.commit();
    return res.status(201).json(responseBody);
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      try {
        const [existing] = await connection.query(
          'SELECT response_status, response_json FROM idempotency_keys WHERE principal_id = ? AND route_key = ? AND key_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1',
          [principalId, routeKey, keyHash]
        );
        const body = existing[0]?.response_json;
        if (body) {
          return res.status(Number(existing[0].response_status) || 201)
            .json(typeof body === 'string' ? JSON.parse(body) : body);
        }
      } catch (lookupError) {
        console.error('Withdrawal idempotency replay lookup failed:', lookupError.code || lookupError.name);
      }
    }
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
