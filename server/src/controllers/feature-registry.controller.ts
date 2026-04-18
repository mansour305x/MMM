import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { featureRegistryService } from '../services/feature-registry.service.js';

const createSchema = z.object({
  kind: z.enum(['feature', 'page', 'button', 'action']),
  code: z.string().regex(/^[a-z0-9_:-]+$/),
  name: z.string().min(2),
  description: z.string().optional(),
  stateName: z.string().optional(),
  configJson: z.unknown().optional(),
  enabled: z.boolean().optional()
});

const toggleSchema = z.object({
  enabled: z.boolean()
});

const listQuerySchema = z.object({
  includeDisabled: z.coerce.boolean().optional(),
  stateName: z.string().optional()
});

export const featureRegistryController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = listQuerySchema.parse(request.query);
    const isGlobalScope = request.userContext?.scopeType === 'global';
    const contextState = request.userContext?.stateName ?? null;
    const targetState = isGlobalScope ? (query.stateName ?? contextState) : contextState;
    const rows = await featureRegistryService.list(targetState, query.includeDisabled ?? true, isGlobalScope);
    return reply.send(rows);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createSchema.parse(request.body);
    const isGlobalScope = request.userContext?.scopeType === 'global';
    const row = await featureRegistryService.create({
      ...body,
      createdBy: request.userContext!.userId,
      isGlobalScope
    });
    return reply.status(201).send(row);
  },

  async toggle(request: FastifyRequest, reply: FastifyReply) {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = toggleSchema.parse(request.body);
    const isGlobalScope = request.userContext?.scopeType === 'global';
    const row = await featureRegistryService.toggle(params.id, body.enabled, isGlobalScope);
    return reply.send(row);
  }
};
