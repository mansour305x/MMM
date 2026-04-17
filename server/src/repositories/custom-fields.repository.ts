import { db } from '../config/database.js';

export const customFieldsRepository = {
  async list() {
    const { rows } = await db.query('SELECT * FROM custom_fields ORDER BY sort_order ASC, created_at ASC');
    return rows;
  },

  async create(input: {
    fieldKey: string;
    label: string;
    type: string;
    required: boolean;
    uniqueValue: boolean;
    showInList: boolean;
    filterable: boolean;
    optionsJson: unknown;
    sortOrder: number;
    createdBy: string;
  }) {
    const query = `
      INSERT INTO custom_fields(field_key, label, type, required, unique_value, show_in_list, filterable, options_json, sort_order, created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;
    const values = [
      input.fieldKey,
      input.label,
      input.type,
      input.required,
      input.uniqueValue,
      input.showInList,
      input.filterable,
      JSON.stringify(input.optionsJson ?? null),
      input.sortOrder,
      input.createdBy
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async upsertClientFieldValues(clientId: string, values: Array<{ fieldId: string; value: unknown }>) {
    for (const item of values) {
      await db.query(
        `
          INSERT INTO client_field_values(client_id, field_id, value_text, updated_at)
          VALUES($1, $2, $3, now())
          ON CONFLICT (client_id, field_id)
          DO UPDATE SET value_text = EXCLUDED.value_text, updated_at = now()
        `,
        [clientId, item.fieldId, item.value == null ? null : String(item.value)]
      );
    }
  },

  async getClientValues(clientId: string) {
    const query = `
      SELECT cf.id AS field_id, cf.label, cf.field_key, cf.type, cf.required,
             cfv.value_text, cfv.value_number, cfv.value_date, cfv.value_bool
      FROM custom_fields cf
      LEFT JOIN client_field_values cfv
        ON cfv.field_id = cf.id AND cfv.client_id = $1
      WHERE cf.is_active = TRUE
      ORDER BY cf.sort_order ASC
    `;
    const { rows } = await db.query(query, [clientId]);
    return rows;
  }
};
