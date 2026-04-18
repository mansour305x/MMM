import { FastifyInstance } from 'fastify';
import { settingsController } from '../controllers/settings.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAuth, requirePermission('settings.manage')] }, settingsController.get);
  app.put('/', { preHandler: [requireAuth, requirePermission('settings.manage')] }, settingsController.update);
}
