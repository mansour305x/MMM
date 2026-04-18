import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { usersService } from '../services/users.service.js';

const createSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  username: z.string().min(3).optional(),
  stateName: z.string().min(2).optional(),
  isStateAccount: z.boolean().optional(),
  password: z.string().min(8),
  roleCode: z.enum(['owner', 'supervisor', 'member', 'state-owner'])
});

const profilePatch = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional()
});

export const usersController = {
  async list(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await usersService.listUsers());
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = createSchema.parse(request.body);
    const user = await usersService.createUser(body);
    return reply.status(201).send(user);
  },

  async updateMyProfile(request: FastifyRequest, reply: FastifyReply) {
    const body = profilePatch.parse(request.body);
    const userId = request.userContext!.userId;
    const user = await usersService.updateMyProfile(userId, body);
    return reply.send(user);
  }
};
