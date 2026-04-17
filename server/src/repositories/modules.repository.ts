import { db } from '../config/database.js';

export const modulesRepository = {
  async list() {
    const { rows } = await db.query('SELECT * FROM modules ORDER BY created_at ASC');
    return rows;
  },

  async create(input: { code: string; name: string; description?: string; enabled?: boolean; createdBy: string }) {
    const query = `
      INSERT INTO modules(code, name, description, enabled, created_by)
      VALUES($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await db.query(query, [input.code, input.name, input.description ?? null, input.enabled ?? true, input.createdBy]);
    return rows[0];
  },

  async setEnabled(moduleId: string, enabled: boolean) {
    const query = 'UPDATE modules SET enabled = $2, updated_at = now() WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [moduleId, enabled]);
    return rows[0] ?? null;
  }
};
