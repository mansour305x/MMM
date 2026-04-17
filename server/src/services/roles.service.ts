import { AppError } from '../middleware/error-handler.js';
import { db } from '../config/database.js';
import { rolesRepository } from '../repositories/roles.repository.js';

export const rolesService = {
  async listRoles() {
    return rolesRepository.listRolesWithPermissions();
  },

  async updateRolePermissions(roleCode: string, permissionCodes: string[]) {
    const role = await rolesRepository.findByCode(roleCode);
    if (!role) throw new AppError(404, 'Role not found');

    const { rows } = await db.query('SELECT code FROM permissions WHERE code = ANY($1::text[])', [permissionCodes]);
    const existing = rows.map((r) => r.code);
    if (existing.length !== permissionCodes.length) {
      throw new AppError(422, 'One or more permission codes are invalid');
    }

    await rolesRepository.replaceRolePermissions(role.id, permissionCodes);
    return { updated: true };
  }
};
