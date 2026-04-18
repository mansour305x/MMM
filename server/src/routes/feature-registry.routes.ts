import { FastifyInstance } from 'fastify';
import { featureRegistryController } from '../controllers/feature-registry.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export async function featureRegistryRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAuth, requirePermission('modules.manage')] }, featureRegistryController.list);
  app.post('/', { preHandler: [requireAuth, requirePermission('modules.manage')] }, featureRegistryController.create);
  app.patch('/:id/toggle', { preHandler: [requireAuth, requirePermission('modules.manage')] }, featureRegistryController.toggle);
}
