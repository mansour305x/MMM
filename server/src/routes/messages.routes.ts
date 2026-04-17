import { FastifyInstance } from 'fastify';
import { messagesController } from '../controllers/messages.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';

export async function messagesRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAuth, requirePermission('clients.read')] }, messagesController.list);
  app.get('/scheduled', { preHandler: [requireAuth, requirePermission('messages.schedule')] }, messagesController.listScheduled);
  app.post('/send-single', { preHandler: [requireAuth, requirePermission('messages.send_single')] }, messagesController.sendSingle);
  app.post('/send-bulk', { preHandler: [requireAuth, requirePermission('messages.send_bulk')] }, messagesController.sendBulk);
  app.post('/schedule', { preHandler: [requireAuth, requirePermission('messages.schedule')] }, messagesController.schedule);
}
