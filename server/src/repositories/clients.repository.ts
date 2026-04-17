import { db } from '../config/database.js';

export const clientsRepository = {
  async list(search?: string) {
    const query = `
      SELECT *
      FROM clients
      WHERE ($1::text IS NULL)
        OR full_name ILIKE ('%' || $1 || '%')
        OR phone ILIKE ('%' || $1 || '%')
        OR COALESCE(email, '') ILIKE ('%' || $1 || '%')
      ORDER BY created_at DESC
    `;
    const { rows } = await db.query(query, [search ?? null]);
    return rows;
  },

  async findById(clientId: string) {
    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1 LIMIT 1', [clientId]);
    return rows[0] ?? null;
  },

  async create(input: { fullName: string; nationalId: string; phone: string; email?: string; region?: string; status?: string; createdBy: string }) {
    const query = `
      INSERT INTO clients(full_name, national_id, phone, email, region, status, created_by)
      VALUES($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [input.fullName, input.nationalId, input.phone, input.email ?? null, input.region ?? null, input.status ?? 'active', input.createdBy];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async update(clientId: string, input: { fullName?: string; nationalId?: string; phone?: string; email?: string; region?: string; status?: string }) {
    const query = `
      UPDATE clients
      SET
        full_name = COALESCE($2, full_name),
        national_id = COALESCE($3, national_id),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        region = COALESCE($6, region),
        status = COALESCE($7, status),
        updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const values = [clientId, input.fullName ?? null, input.nationalId ?? null, input.phone ?? null, input.email ?? null, input.region ?? null, input.status ?? null];
    const { rows } = await db.query(query, values);
    return rows[0] ?? null;
  },

  async remove(clientId: string) {
    await db.query('DELETE FROM clients WHERE id = $1', [clientId]);
  }
};
