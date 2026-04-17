import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  password: z.string().min(8)
});

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8)
});

const otpSchema = z.object({
  destination: z.string().min(3),
  purpose: z.enum(['register', 'forgot_password', 'login']),
  code: z.string().length(6)
});

const forgotSchema = z.object({ identifier: z.string().min(3) });
const resetSchema = z.object({ identifier: z.string().min(3), otpCode: z.string().length(6), newPassword: z.string().min(8) });

export const authController = {
  async register(request: FastifyRequest, reply: FastifyReply) {
    const body = registerSchema.parse(request.body);
    const result = await authService.register(body);
    return reply.status(201).send(result);
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = loginSchema.parse(request.body);
    const result = await authService.login(request.server, {
      ...body,
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip
    });
    return reply.send(result);
  },

  async verifyOtp(request: FastifyRequest, reply: FastifyReply) {
    const body = otpSchema.parse(request.body);
    const result = await authService.verifyOtp(body.destination, body.purpose, body.code);
    return reply.send(result);
  },

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const body = forgotSchema.parse(request.body);
    const result = await authService.forgotPassword(body.identifier);
    return reply.send(result);
  },

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const body = resetSchema.parse(request.body);
    const result = await authService.resetPassword(body.identifier, body.otpCode, body.newPassword);
    return reply.send(result);
  }
};
