import { createHash, randomBytes } from 'node:crypto';
import pool from '../config/db.js';

const hashSessionToken = (token) => createHash('sha256').update(token).digest('hex');
const WATCH_THRESHOLD = 0.9;
const MAX_HEARTBEAT_GAP_MS = 30000;

const validId = (value) => /^\d{1,10}$/.test(String(value || ''));

export const startWatchSession = async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid video ID.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [videos] = await connection.query(
      'SELECT id, duration_seconds, is_active, current_views, max_views FROM videos WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    const video = videos[0];
    if (!video || !video.is_active || Number(video.current_views) >= Number(video.max_views)) {
      await connection.rollback();
      return res.status(404).json({ error: 'This video is not currently available.' });
    }
    const [views] = await connection.query(
      'SELECT id FROM video_views WHERE user_id = ? AND video_id = ? LIMIT 1',
      [req.user.id, video.id]
    );
    if (views.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'You have already completed this video.' });
    }

    const now = Date.now();
    await connection.query(
      'UPDATE video_watch_sessions SET completed_at_ms = ? WHERE user_id = ? AND video_id = ? AND completed_at_ms IS NULL',
      [now, req.user.id, video.id]
    );
    const token = randomBytes(32).toString('base64url');
    await connection.query(
      `INSERT INTO video_watch_sessions
       (user_id, video_id, session_hash, started_at_ms, last_heartbeat_at_ms,
        last_position_ms, watched_ms, expires_at_ms)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?)`,
      [req.user.id, video.id, hashSessionToken(token), now, now, now + 2 * 60 * 60 * 1000]
    );
    await connection.commit();
    return res.status(201).json({
      sessionToken: token,
      durationSeconds: Number(video.duration_seconds),
      minimumWatchSeconds: Math.ceil(Number(video.duration_seconds) * WATCH_THRESHOLD),
      expiresAt: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    await connection.rollback();
    console.error('Start watch session error:', error.code || error.name);
    return res.status(503).json({ error: 'Could not start a watch session.' });
  } finally {
    connection.release();
  }
};

export const recordWatchProgress = async (req, res) => {
  const token = String(req.body.sessionToken || '');
  const currentTime = Number(req.body.currentTimeSeconds);
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token) || !Number.isFinite(currentTime) || currentTime < 0) {
    return res.status(400).json({ error: 'A valid watch session and playback position are required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT s.*, v.duration_seconds
       FROM video_watch_sessions s
       JOIN videos v ON v.id = s.video_id
       WHERE s.session_hash = ? AND s.user_id = ? AND s.video_id = ?
       FOR UPDATE`,
      [hashSessionToken(token), req.user.id, req.params.id]
    );
    const session = rows[0];
    const now = Date.now();
    if (!session || session.completed_at_ms || Number(session.expires_at_ms) <= now) {
      await connection.rollback();
      return res.status(410).json({ error: 'This watch session has expired. Start again.' });
    }

    const elapsedMs = now - Number(session.last_heartbeat_at_ms);
    if (elapsedMs < 1500) {
      await connection.rollback();
      return res.status(429).json({ error: 'Playback progress was submitted too quickly.' });
    }
    if (elapsedMs > MAX_HEARTBEAT_GAP_MS) {
      await connection.rollback();
      return res.status(409).json({ error: 'Playback session paused. Resume watching and retry.' });
    }

    const positionMs = Math.round(currentTime * 1000);
    const deltaMs = positionMs - Number(session.last_position_ms);
    if (positionMs > Number(session.duration_seconds) * 1000 ||
        deltaMs < 0 || deltaMs > elapsedMs * 1.25 + 1500) {
      await connection.rollback();
      return res.status(409).json({ error: 'Playback position jumped unexpectedly. Seeked time does not earn rewards.' });
    }

    const countedMs = Math.max(0, Math.min(deltaMs, elapsedMs));
    const [update] = await connection.query(
      `UPDATE video_watch_sessions
       SET watched_ms = watched_ms + ?, last_position_ms = ?, last_heartbeat_at_ms = ?
       WHERE id = ? AND completed_at_ms IS NULL`,
      [countedMs, positionMs, now, session.id]
    );
    if (update.affectedRows !== 1) {
      await connection.rollback();
      return res.status(409).json({ error: 'Watch session is no longer active.' });
    }
    await connection.commit();

    const watchedSeconds = Math.floor((Number(session.watched_ms) + countedMs) / 1000);
    const durationSeconds = Number(session.duration_seconds);
    return res.json({
      watchedSeconds,
      durationSeconds,
      progressPercent: Math.min(100, Math.floor((watchedSeconds / durationSeconds) * 100)),
      canClaimReward: watchedSeconds >= Math.ceil(durationSeconds * WATCH_THRESHOLD),
    });
  } catch (error) {
    await connection.rollback();
    console.error('Record watch progress error:', error.code || error.name);
    return res.status(503).json({ error: 'Could not record playback progress.' });
  } finally {
    connection.release();
  }
};

export const completeWatchSession = async (req, res) => {
  const token = String(req.body.sessionToken || '');
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
    return res.status(400).json({ error: 'A valid watch session is required.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT s.*, v.title, v.duration_seconds, v.reward_points, v.reward_amount,
              v.current_views, v.max_views, v.is_active
       FROM video_watch_sessions s
       JOIN videos v ON v.id = s.video_id
       WHERE s.session_hash = ? AND s.user_id = ? AND s.video_id = ?
       FOR UPDATE`,
      [hashSessionToken(token), req.user.id, req.params.id]
    );
    const session = rows[0];
    const now = Date.now();
    if (!session || session.completed_at_ms || Number(session.expires_at_ms) <= now || !session.is_active) {
      await connection.rollback();
      return res.status(410).json({ error: 'This watch session is no longer valid.' });
    }

    const watchedMs = Number(session.watched_ms);
    const durationSeconds = Number(session.duration_seconds);
    const requiredMs = Math.ceil(durationSeconds * WATCH_THRESHOLD * 1000);
    if (watchedMs < requiredMs) {
      await connection.rollback();
      return res.status(409).json({
        error: 'Keep watching before claiming your reward.',
        progressPercent: Math.min(100, Math.floor((watchedMs / (durationSeconds * 1000)) * 100)),
        requiredSeconds: Math.ceil(requiredMs / 1000),
        watchedSeconds: Math.floor(watchedMs / 1000),
      });
    }

    const [views] = await connection.query(
      'SELECT id FROM video_views WHERE user_id = ? AND video_id = ? LIMIT 1',
      [req.user.id, req.params.id]
    );
    if (views.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'This video has already been rewarded.' });
    }
    if (Number(session.current_views) >= Number(session.max_views)) {
      await connection.rollback();
      return res.status(409).json({ error: 'This video has reached its view limit.' });
    }

    const earnedPoints = Math.max(0, Number(session.reward_points) || 0);
    const earnedAmount = String(session.reward_amount || '0.00');
    const [viewResult] = await connection.query(
      `INSERT INTO video_views
       (user_id, video_id, watch_duration, earned_points, earned_amount)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, req.params.id, Math.floor(watchedMs / 1000), earnedPoints, earnedAmount]
    );
    await connection.query(
      'UPDATE users SET points = points + ?, balance = balance + ?, total_earned = total_earned + ? WHERE id = ?',
      [earnedPoints, earnedAmount, earnedAmount, req.user.id]
    );
    await connection.query(
      `INSERT INTO transactions (user_id, type, amount, description, status, payment_reference)
       VALUES (?, 'video_reward', ?, ?, 'completed', ?)`,
      [req.user.id, earnedAmount, `Reward for watching: ${session.title}`, `video-view:${viewResult.insertId}`]
    );
    const [viewUpdate] = await connection.query(
      'UPDATE videos SET current_views = current_views + 1 WHERE id = ? AND current_views < max_views',
      [req.params.id]
    );
    if (viewUpdate.affectedRows !== 1) throw new Error('Video view cap was reached during reward processing.');

    await connection.query(
      'UPDATE video_watch_sessions SET completed_at_ms = ? WHERE id = ? AND completed_at_ms IS NULL',
      [now, session.id]
    );
    await connection.commit();
    return res.json({
      message: 'Watch completed and reward credited.',
      completed: true,
      earnedPoints,
      earnedAmount,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Complete watch session error:', error.code || error.name);
    return res.status(503).json({ error: 'Could not complete the watch session.' });
  } finally {
    connection.release();
  }
};
