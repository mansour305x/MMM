import { db } from '../config/database.js';

export const clientsRepository = {
  async list(search?: string, stateName?: string | null, isGlobalScope = false) {
    const query = `
      SELECT *
      FROM clients
      WHERE ($1::boolean = TRUE OR state_name = $2)
        AND (
          ($3::text IS NULL)
          OR full_name ILIKE ('%' || $3 || '%')
          OR phone ILIKE ('%' || $3 || '%')
          OR COALESCE(email, '') ILIKE ('%' || $3 || '%')
        )
      ORDER BY created_at DESC
    `;
    const { rows } = await db.query(query, [isGlobalScope, stateName ?? null, search ?? null]);
    return rows;
  },

  async findById(clientId: string, stateName?: string | null, isGlobalScope = false) {
    const { rows } = await db.query(
      'SELECT * FROM clients WHERE id = $1 AND ($2::boolean = TRUE OR state_name = $3) LIMIT 1',
      [clientId, isGlobalScope, stateName ?? null]
    );
    return rows[0] ?? null;
  },

  async create(input: {
    fullName: string;
    nationalId: string;
    phone: string;
    email?: string;
    region?: string;
    status?: string;
    stateName?: string | null;
    createdBy: string;
  }) {
    const query = `
      INSERT INTO clients(full_name, national_id, phone, email, region, state_name, status, created_by)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      input.fullName,
      input.nationalId,
      input.phone,
      input.email ?? null,
      input.region ?? null,
      input.stateName ?? null,
      input.status ?? 'active',
      input.createdBy
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async update(
    clientId: string,
    input: { fullName?: string; nationalId?: string; phone?: string; email?: string; region?: string; status?: string },
    stateName?: string | null,
    isGlobalScope = false
  ) {
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
        AND ($8::boolean = TRUE OR state_name = $9)
      RETURNING *
    `;
    const values = [
      clientId,
      input.fullName ?? null,
      input.nationalId ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.region ?? null,
      input.status ?? null,
      isGlobalScope,
      stateName ?? null
    ];
    const { rows } = await db.query(query, values);
    return rows[0] ?? null;
  },

  async remove(clientId: string, stateName?: string | null, isGlobalScope = false) {
    await db.query('BEGIN');
    try {
      await db.query(
        'UPDATE sms_messages SET recipient_client_id = NULL WHERE recipient_client_id = $1 AND ($2::boolean = TRUE OR state_name = $3)',
        [clientId, isGlobalScope, stateName ?? null]
      );
      await db.query('DELETE FROM clients WHERE id = $1 AND ($2::boolean = TRUE OR state_name = $3)', [clientId, isGlobalScope, stateName ?? null]);
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
};
