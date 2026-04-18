import { db } from '../config/database.js';

export interface FeatureRegistryCreateInput {
  kind: 'feature' | 'page' | 'button' | 'action';
  code: string;
  name: string;
  description?: string;
  stateName?: string | null;
  configJson?: unknown;
  enabled?: boolean;
  createdBy: string;
}

export const featureRegistryRepository = {
  async list(stateName?: string | null, includeDisabled = true, isGlobalScope = false) {
    const query = `
      SELECT *
      FROM feature_registry
      WHERE ($1::boolean = TRUE OR state_name IS NULL OR state_name = $2)
        AND ($3::boolean = TRUE OR enabled = TRUE)
      ORDER BY created_at DESC
    `;
    const { rows } = await db.query(query, [isGlobalScope, stateName ?? null, includeDisabled]);
    return rows;
  },

  async create(input: FeatureRegistryCreateInput) {
    const query = `
      INSERT INTO feature_registry(kind, code, name, description, state_name, config_json, enabled, created_by)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      input.kind,
      input.code,
      input.name,
      input.description ?? null,
      input.stateName ?? null,
      JSON.stringify(input.configJson ?? {}),
      input.enabled ?? true,
      input.createdBy
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async setEnabled(id: string, enabled: boolean) {
    const query = `
      UPDATE feature_registry
      SET enabled = $2, updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [id, enabled]);
    return rows[0] ?? null;
  }
};
