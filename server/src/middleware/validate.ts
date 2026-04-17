import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodSchema } from 'zod';
import { AppError } from './error-handler.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return async function validator(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      throw new AppError(422, 'Validation failed', result.error.flatten());
    }
    request.body = result.data as object;
  };
}
