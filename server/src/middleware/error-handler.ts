import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(error: FastifyError | AppError, _request: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({ message: error.message, details: error.details ?? null });
    return;
  }

  reply.status(500).send({ message: 'Internal server error' });
}
