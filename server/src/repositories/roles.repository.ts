import { db } from '../config/database.js';

export const rolesRepository = {
  async findByCode(code: string) {
    const { rows } = await db.query('SELECT * FROM roles WHERE code = $1 LIMIT 1', [code]);
    return rows[0] ?? null;
  },

  async listRolesWithPermissions() {
    const query = `
      SELECT r.id, r.code, r.name, r.description,
             COALESCE(json_agg(p.code) FILTER (WHERE p.code IS NOT NULL), '[]') AS permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      GROUP BY r.id
      ORDER BY r.created_at ASC
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async listPermissionsByRoleId(roleId: string): Promise<string[]> {
    const query = `
      SELECT p.code
      FROM permissions p
      JOIN role_permissions rp ON rp.permission_id = p.id
      WHERE rp.role_id = $1
    `;
    const { rows } = await db.query(query, [roleId]);
    return rows.map((r) => r.code);
  },

  async replaceRolePermissions(roleId: string, permissionCodes: string[]) {
    await db.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
    if (!permissionCodes.length) return;

    const query = `
      INSERT INTO role_permissions(role_id, permission_id)
      SELECT $1, p.id
      FROM permissions p
      WHERE p.code = ANY($2::text[])
    `;
    await db.query(query, [roleId, permissionCodes]);
  }
};
