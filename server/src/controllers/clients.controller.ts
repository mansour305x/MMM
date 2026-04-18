import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { clientsService } from '../services/clients.service.js';

const dynamicValueSchema = z.object({
  fieldId: z.string().uuid(),
  value: z.unknown()
});

const createSchema = z.object({
  fullName: z.string().min(2),
  nationalId: z.string().min(5),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  region: z.string().optional(),
  stateName: z.string().optional(),
  status: z.string().optional(),
  dynamicValues: z.array(dynamicValueSchema).optional()
});

const updateSchema = createSchema.partial();

export const clientsController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = z.object({ search: z.string().optional() }).parse(request.query);
    const isGlobalScope = request.userContext?.scopeType === 'global';
    const stateName = request.userContext?.stateName ?? null;
    return reply.send(await clientsService.list(query.search, stateName, isGlobalScope));
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const isGlobalScope = request.userContext?.scopeType === 'global';
    const stateName = request.userContext?.stateName ?? null;
    return reply.send(await clientsService.withDynamicValues(params.id, stateName, isGlobalScope));
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createSchema.parse(request.body);
    const isGlobalScope = request.userContext?.scopeType === 'global';
    const contextState = request.userContext?.stateName ?? null;
    const targetStateName = isGlobalScope ? (body.stateName ?? contextState) : contextState;
    const client = await clientsService.create({
      ...body,
      stateName: targetStateName,
      isGlobalScope,
      createdBy: request.userContext!.userId
    });
    return reply.status(201).send(client);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const isGlobalScope = request.userContext?.scopeType === 'global';
    const stateName = request.userContext?.stateName ?? null;
    const client = await clientsService.update(params.id, body, stateName, isGlobalScope);
    return reply.send(client);
  },

  async remove(request: FastifyRequest, reply: FastifyReply) {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const isGlobalScope = request.userContext?.scopeType === 'global';
    const stateName = request.userContext?.stateName ?? null;
    return reply.send(await clientsService.remove(params.id, stateName, isGlobalScope));
  }
};
