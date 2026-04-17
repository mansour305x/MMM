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
  status: z.string().optional(),
  dynamicValues: z.array(dynamicValueSchema).optional()
});

const updateSchema = createSchema.partial();

export const clientsController = {
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = z.object({ search: z.string().optional() }).parse(request.query);
    return reply.send(await clientsService.list(query.search));
  },

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    return reply.send(await clientsService.withDynamicValues(params.id));
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createSchema.parse(request.body);
    const client = await clientsService.create({ ...body, createdBy: request.userContext!.userId });
    return reply.status(201).send(client);
  },

  async update(request: FastifyRequest, reply: FastifyReply) {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = updateSchema.parse(request.body);
    const client = await clientsService.update(params.id, body);
    return reply.send(client);
  },

  async remove(request: FastifyRequest, reply: FastifyReply) {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    return reply.send(await clientsService.remove(params.id));
  }
};
