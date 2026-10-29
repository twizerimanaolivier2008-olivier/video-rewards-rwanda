import pool from '../config/db.js';

const Video = {
  async findAll(page = 1, limit = 20, category = null) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM videos WHERE is_active = TRUE';
    const params = [];
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM videos WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async create(videoData) {
    const { title, description, video_url, thumbnail_url, advertiser_id, category, duration_seconds, reward_points, reward_amount } = videoData;
    const [result] = await pool.query(
      'INSERT INTO videos (title, description, video_url, thumbnail_url, advertiser_id, category, duration_seconds, reward_points, reward_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, video_url, thumbnail_url, advertiser_id, category, duration_seconds, reward_points || 10, reward_amount || 0.00]
    );
    return this.findById(result.insertId);
  },

  async update(id, videoData) {
    const { title, description, video_url, thumbnail_url, category, duration_seconds, reward_points, reward_amount, is_active, max_views } = videoData;
    const [result] = await pool.query(
      'UPDATE videos SET title = ?, description = ?, video_url = ?, thumbnail_url = ?, category = ?, duration_seconds = ?, reward_points = ?, reward_amount = ?, is_active = ?, max_views = ? WHERE id = ?',
      [title, description, video_url, thumbnail_url, category, duration_seconds, reward_points, reward_amount, is_active, max_views, id]
    );
    return this.findById(id);
  },

  async incrementViews(id) {
    await pool.query('UPDATE videos SET current_views = current_views + 1 WHERE id = ?', [id]);
    return this.findById(id);
  },

  async getActiveVideos() {
    const [rows] = await pool.query('SELECT * FROM videos WHERE is_active = TRUE AND current_views < max_views');
    return rows;
  },

  async getVideosByCategory(category) {
    const [rows] = await pool.query('SELECT * FROM videos WHERE category = ? AND is_active = TRUE AND current_views < max_views', [category]);
    return rows;
  },

  async getAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT * FROM videos ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows;
  },

  async getCount() {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM videos');
    return rows[0].count;
  }
};

export default Video;
