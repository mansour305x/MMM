import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { messagesService } from '../services/messages.service.js';

const channelEnum = z.enum(['sms', 'whatsapp', 'email']);

const sendSingleSchema = z.object({
  channel: channelEnum,
  clientId: z.string().uuid().optional(),
  phone: z.string().min(8).optional(),
  body: z.string().min(1)
});

const sendBulkSchema = z.object({
  channel: channelEnum,
  body: z.string().min(1),
  target: z.object({
    type: z.enum(['all', 'segment', 'ids']),
    ids: z.array(z.string().uuid()).optional(),
    region: z.string().optional()
  })
});

const scheduleSchema = z.object({
  name: z.string().min(2),
  channel: channelEnum,
  bodyTemplate: z.string().min(1),
  targetType: z.enum(['single', 'bulk', 'segment']),
  targetPayload: z.unknown(),
  scheduledAt: z.string().datetime(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']),
  recurrencePayload: z.unknown().optional()
});

export const messagesController = {
  async sendSingle(request: FastifyRequest, reply: FastifyReply) {
    const body = sendSingleSchema.parse(request.body);
    const row = await messagesService.sendSingle({ ...body, createdBy: request.userContext!.userId });
    return reply.status(201).send(row);
  },

  async sendBulk(request: FastifyRequest, reply: FastifyReply) {
    const body = sendBulkSchema.parse(request.body);
    const result = await messagesService.sendBulk({ ...body, createdBy: request.userContext!.userId });
    return reply.status(202).send(result);
  },

  async schedule(request: FastifyRequest, reply: FastifyReply) {
    const body = scheduleSchema.parse(request.body);
    const row = await messagesService.createSchedule({
      ...body,
      targetPayload: body.targetPayload,
      createdBy: request.userContext!.userId
    });
    return reply.status(201).send(row);
  },

  async list(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await messagesService.listMessages());
  },

  async listScheduled(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await messagesService.listScheduled());
  }
};
