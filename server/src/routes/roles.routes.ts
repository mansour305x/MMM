import { FastifyInstance } from 'fastify';
import { rolesController } from '../controllers/roles.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export async function rolesRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAuth, requirePermission('roles.manage')] }, rolesController.list);
  app.put('/:roleCode/permissions', { preHandler: [requireAuth, requirePermission('roles.manage')] }, rolesController.updatePermissions);
}
