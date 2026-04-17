import { FastifyInstance } from 'fastify';
import { clientsController } from '../controllers/clients.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export async function clientsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAuth, requirePermission('clients.read')] }, clientsController.list);
  app.get('/:id', { preHandler: [requireAuth, requirePermission('clients.read')] }, clientsController.getById);
  app.post('/', { preHandler: [requireAuth, requirePermission('clients.create')] }, clientsController.create);
  app.patch('/:id', { preHandler: [requireAuth, requirePermission('clients.update')] }, clientsController.update);
  app.delete('/:id', { preHandler: [requireAuth, requirePermission('clients.delete')] }, clientsController.remove);
}
