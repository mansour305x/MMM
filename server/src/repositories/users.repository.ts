import { db } from '../config/database.js';

export const usersRepository = {
  async findByEmailOrPhone(identifier: string, stateName?: string | null, onlyStateAccounts = false) {
    const query = `
      SELECT u.*, r.code AS role_code
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE (u.email = $1 OR u.phone = $1 OR u.username = $1)
        AND ($2::text IS NULL OR u.state_name = $2)
        AND ($3::boolean = FALSE OR u.is_state_account = TRUE)
      LIMIT 1
    `;
    const { rows } = await db.query(query, [identifier, stateName ?? null, onlyStateAccounts]);
    return rows[0] ?? null;
  },

  async findStateAccountByStateName(stateName: string) {
    const query = `
      SELECT u.*, r.code AS role_code
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.state_name = $1
        AND u.is_state_account = TRUE
      LIMIT 1
    `;
    const { rows } = await db.query(query, [stateName]);
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
      SELECT u.id, u.full_name, u.email, u.phone, u.username, u.state_name, u.is_state_account, u.status, u.created_at, r.code AS role_code, r.name AS role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async create(input: {
    roleId: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    username?: string | null;
    stateName?: string | null;
    isStateAccount?: boolean;
    passwordHash: string;
  }) {
    const query = `
      INSERT INTO users (role_id, full_name, email, phone, username, state_name, is_state_account, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, full_name, email, phone, username, state_name, is_state_account, role_id, status, created_at
    `;
    const values = [
      input.roleId,
      input.fullName,
      input.email,
      input.phone,
      input.username ?? null,
      input.stateName ?? null,
      input.isStateAccount ?? false,
      input.passwordHash
    ];
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
