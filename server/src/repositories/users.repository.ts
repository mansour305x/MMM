import { db } from '../config/database.js';

export const usersRepository = {
  async findByEmailOrPhone(identifier: string) {
    const query = `
      SELECT u.*, r.code AS role_code
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.email = $1 OR u.phone = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [identifier]);
    return rows[0] ?? null;
  },

  async findById(userId: string) {
    const query = `
      SELECT u.*, r.code AS role_code
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      LIMIT 1
    `;
    const { rows } = await db.query(query, [userId]);
    return rows[0] ?? null;
  },

  async list() {
    const query = `
      SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at, r.code AS role_code, r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async create(input: { roleId: string; fullName: string; email: string | null; phone: string | null; passwordHash: string }) {
    const query = `
      INSERT INTO users (role_id, full_name, email, phone, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, email, phone, role_id, status, created_at
    `;
    const values = [input.roleId, input.fullName, input.email, input.phone, input.passwordHash];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async updateProfile(userId: string, patch: { fullName?: string; email?: string; phone?: string }) {
    const query = `
      UPDATE users
      SET
        full_name = COALESCE($2, full_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        updated_at = now()
      WHERE id = $1
      RETURNING id, full_name, email, phone, updated_at
    `;
    const { rows } = await db.query(query, [userId, patch.fullName ?? null, patch.email ?? null, patch.phone ?? null]);
    return rows[0] ?? null;
  }
};
