import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { featuresService } from '../services/features.service.js';

const createSchema = z.object({
  code: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string().min(2),
  description: z.string().optional(),
  enabled: z.boolean().optional()
});

const toggleSchema = z.object({
  enabled: z.boolean()
});

export const featuresController = {
  async list(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await featuresService.list());
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createSchema.parse(request.body);
    const row = await featuresService.create({ ...body, createdBy: request.userContext!.userId });
    return reply.status(201).send(row);
  },

  async toggle(request: FastifyRequest, reply: FastifyReply) {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = toggleSchema.parse(request.body);
    const row = await featuresService.toggle(params.id, body.enabled);
    return reply.send(row);
  }
};
