import { FastifyInstance } from 'fastify';
import { usersController } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAuth, requirePermission('users.read')] }, usersController.list);
  app.post('/', { preHandler: [requireAuth, requirePermission('users.create')] }, usersController.create);
  app.patch('/me', { preHandler: [requireAuth] }, usersController.updateMyProfile);
}
