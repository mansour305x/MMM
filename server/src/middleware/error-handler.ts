import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { z } from 'zod';

export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(error: FastifyError | AppError | ZodError, _request: FastifyRequest, reply: FastifyReply): void {
  // Always return JSON, never HTML

  if (error instanceof AppError) {
    reply.status(error.statusCode)
      .header('Content-Type', 'application/json')
      .send({ message: error.message, details: error.details ?? null });
    return;
  }

  if (error instanceof ZodError || error.name === 'ZodError') {
    const zErr = error as ZodError;
    reply.status(400)
      .header('Content-Type', 'application/json')
      .send({ 
        message: 'بيانات غير صحيحة',
        details: zErr.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    return;
  }

  // Fastify validation errors (JSON schema)
  if ((error as FastifyError).statusCode === 400) {
    reply.status(400)
      .header('Content-Type', 'application/json')
      .send({ message: error.message || 'طلب غير صحيح', details: null });
    return;
  }

  // Rate limit errors
  if ((error as FastifyError).statusCode === 429) {
    reply.status(429)
      .header('Content-Type', 'application/json')
      .send({ message: 'طلبات كثيرة جداً، انتظر قليلاً', details: null });
    return;
  }

  reply.status(500)
    .header('Content-Type', 'application/json')
    .send({ message: 'خطأ داخلي في الخادم', details: null });
}
