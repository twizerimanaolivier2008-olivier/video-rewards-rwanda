import pool from '../config/db.js';

const Company = {
  async findAll(page = 1, limit = 20, search = null) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM companies';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR email LIKE ? OR contact_person LIKE ?';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM companies WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM companies WHERE email = ?', [email]);
    return rows[0] || null;
  },

  async create(data) {
    const {
      name, email, phone, website, logo_url, description, contact_person, is_active = true
    } = data;
    const [result] = await pool.query(
      `INSERT INTO companies (name, email, phone, website, logo_url, description, contact_person, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email || null, phone || null, website || null, logo_url || null, description || null, contact_person || null, is_active]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const {
      name, email, phone, website, logo_url, description, contact_person, is_active
    } = data;
    await pool.query(
      `UPDATE companies SET name = ?, email = ?, phone = ?, website = ?, logo_url = ?, description = ?, contact_person = ?, is_active = ?
       WHERE id = ?`,
      [name, email || null, phone || null, website || null, logo_url || null, description || null, contact_person || null, is_active, id]
    );
    return this.findById(id);
  },

  async remove(id) {
    await pool.query('DELETE FROM companies WHERE id = ?', [id]);
  },

  async countActive() {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM companies WHERE is_active = TRUE');
    return rows[0].count;
  }
};

export default Company;
