import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { z } from 'zod';

export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}

// Standardized Arabic error messages
const aradicErrorMessages: Record<number, string> = {
  400: 'طلب غير صحيح',
  401: 'بيانات اعتماد غير صحيحة',
  403: 'ليس لديك صلاحيات كافية',
  404: 'المورد المطلوب غير موجود',
  422: 'البيانات المُدخلة غير صالحة',
  429: 'طلبات كثيرة جداً، انتظر قليلاً',
  500: 'خطأ داخلي في الخادم'
};

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
    reply.status(422)
      .header('Content-Type', 'application/json')
      .send({ 
        message: 'البيانات المُدخلة غير صالحة',
        details: zErr.errors.map(e => ({ 
          field: e.path.join('.'), 
          message: e.message,
          code: e.code
        }))
      });
    return;
  }

  // Fastify validation errors (JSON schema)
  if ((error as FastifyError).statusCode === 400) {
    reply.status(400)
      .header('Content-Type', 'application/json')
      .send({ message: aradicErrorMessages[400], details: null });
    return;
  }

  // Preserve auth/forbidden and other client errors from Fastify plugins (e.g., JWT)
  const fastifyStatus = (error as FastifyError).statusCode;
  if (typeof fastifyStatus === 'number' && fastifyStatus >= 401 && fastifyStatus < 500) {
    const message = aradicErrorMessages[fastifyStatus] || error.message || 'خطأ في الطلب';
    reply.status(fastifyStatus)
      .header('Content-Type', 'application/json')
      .send({ message, details: null });
    return;
  }

  // Rate limit errors
  if ((error as FastifyError).statusCode === 429) {
    reply.status(429)
      .header('Content-Type', 'application/json')
      .send({ message: aradicErrorMessages[429], details: null });
    return;
  }

  reply.status(500)
    .header('Content-Type', 'application/json')
    .send({ message: aradicErrorMessages[500], details: null });
}
