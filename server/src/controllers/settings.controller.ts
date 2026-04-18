import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { settingsService } from '../services/settings.service.js';

const querySchema = z.object({
  stateName: z.string().optional()
});

const updateSchema = z.object({
  settingsJson: z.unknown().default({})
});

export const settingsController = {
  async get(request: FastifyRequest, reply: FastifyReply) {
    const query = querySchema.parse(request.query);
    const isGlobalScope = request.userContext?.scopeType === 'global';
    const targetState = isGlobalScope ? (query.stateName ?? null) : (request.userContext?.stateName ?? null);
    const row = await settingsService.get(targetState);
    return reply.send(row);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const query = querySchema.parse(request.query);
    const body = updateSchema.parse(request.body);
    const isGlobalScope = request.userContext?.scopeType === 'global';
    const targetState = isGlobalScope ? (query.stateName ?? null) : (request.userContext?.stateName ?? null);
    const row = await settingsService.update(targetState, body.settingsJson, request.userContext!.userId);
    return reply.send(row);
  }
};
