import { db } from '../config/database.js';

export const settingsRepository = {
  async getByState(stateName: string) {
    const { rows } = await db.query('SELECT * FROM state_settings WHERE state_name = $1 LIMIT 1', [stateName]);
    return rows[0] ?? null;
  },

  async upsertByState(stateName: string, settingsJson: unknown, userId: string) {
    const query = `
      INSERT INTO state_settings(state_name, settings_json, updated_by)
      VALUES($1, $2, $3)
      ON CONFLICT(state_name)
      DO UPDATE SET settings_json = EXCLUDED.settings_json, updated_by = EXCLUDED.updated_by, updated_at = now()
      RETURNING *
    `;
    const { rows } = await db.query(query, [stateName, JSON.stringify(settingsJson ?? {}), userId]);
    return rows[0];
  }
};
