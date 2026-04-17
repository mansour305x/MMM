import { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from './error-handler.js';

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  await request.jwtVerify();
  if (request.user.type !== 'access') throw new AppError(401, 'Invalid token type');

  request.userContext = {
    userId: request.user.sub,
    roleCode: request.user.roleCode,
    permissions: request.user.permissions
  };
}
