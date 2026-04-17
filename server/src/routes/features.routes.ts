import { FastifyInstance } from 'fastify';
import { featuresController } from '../controllers/features.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export async function featuresRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAuth, requirePermission('modules.manage')] }, featuresController.list);
  app.post('/', { preHandler: [requireAuth, requirePermission('modules.manage')] }, featuresController.create);
  app.patch('/:id/toggle', { preHandler: [requireAuth, requirePermission('modules.manage')] }, featuresController.toggle);
}
