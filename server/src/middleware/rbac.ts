import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from './error-handler.js';

export function requirePermission(permission: string) {
  return async function checkPermission(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const permissions = request.userContext?.permissions ?? [];
    if (!permissions.includes(permission)) {
      throw new AppError(403, 'Forbidden');
    }
  };
}
