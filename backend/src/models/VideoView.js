import pool from '../config/db.js';

const VideoView = {
  async create(viewData) {
    const { user_id, video_id, watch_duration, earned_points, earned_amount } = viewData;
    const [result] = await pool.query(
      'INSERT INTO video_views (user_id, video_id, watch_duration, earned_points, earned_amount) VALUES (?, ?, ?, ?, ?)',
      [user_id, video_id, watch_duration, earned_points, earned_amount]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM video_views WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByUserId(user_id) {
    const [rows] = await pool.query('SELECT * FROM video_views WHERE user_id = ?', [user_id]);
    return rows;
  },

  async findByVideoId(video_id) {
    const [rows] = await pool.query('SELECT * FROM video_views WHERE video_id = ?', [video_id]);
    return rows;
  },

  async getUserViews(user_id) {
    const [rows] = await pool.query(
      'SELECT v.*, vv.watch_duration, vv.earned_points, vv.earned_amount, vv.created_at AS viewed_at FROM video_views vv JOIN videos v ON vv.video_id = v.id WHERE vv.user_id = ? ORDER BY vv.created_at DESC',
      [user_id]
    );
    return rows;
  },

  async getVideoViews(video_id) {
    const [rows] = await pool.query(
      'SELECT u.id, u.first_name, u.last_name, u.email, vv.watch_duration, vv.earned_points, vv.created_at FROM video_views vv JOIN users u ON vv.user_id = u.id WHERE vv.video_id = ?',
      [video_id]
    );
    return rows;
  },

  async hasWatched(user_id, video_id) {
    const [rows] = await pool.query(
      'SELECT * FROM video_views WHERE user_id = ? AND video_id = ?',
      [user_id, video_id]
    );
    return rows.length > 0;
  }
};

export default VideoView;
