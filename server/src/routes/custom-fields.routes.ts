import { FastifyInstance } from 'fastify';
import { customFieldsController } from '../controllers/custom-fields.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export async function customFieldsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAuth, requirePermission('clients.read')] }, customFieldsController.list);
  app.post('/', { preHandler: [requireAuth, requirePermission('fields.manage')] }, customFieldsController.create);
}
