import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { customFieldsService } from '../services/custom-fields.service.js';

const createSchema = z.object({
  fieldKey: z.string().regex(/^[a-z0-9_]+$/),
  label: z.string().min(2),
  type: z.enum(['text', 'number', 'phone', 'email', 'date', 'select', 'checkbox', 'textarea', 'url']),
  required: z.boolean().default(false),
  uniqueValue: z.boolean().default(false),
  showInList: z.boolean().default(true),
  filterable: z.boolean().default(true),
  optionsJson: z.unknown().optional(),
  sortOrder: z.number().int().default(0)
});

export const customFieldsController = {
  async list(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await customFieldsService.list());
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createSchema.parse(request.body);
    const row = await customFieldsService.create({
      ...body,
      optionsJson: body.optionsJson ?? null,
      createdBy: request.userContext!.userId
    });
    return reply.status(201).send(row);
  }
};
