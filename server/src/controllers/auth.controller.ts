import { FastifyReply, FastifyRequest } from 'fastify';
import { z, ZodError } from 'zod';
import { authService } from '../services/auth.service.js';
import { AppError } from '../middleware/error-handler.js';

const registerSchema = z.object({
  fullName: z.string().min(2, 'الاسم يجب أن يكون حرفان على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  phone: z.string().min(8, 'رقم الهاتف قصير جداً').optional(),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
});

const loginSchema = z.object({
  identifier: z.string().min(3, 'البريد أو الهاتف مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة')
});

const otpSchema = z.object({
  destination: z.string().min(3),
  purpose: z.enum(['register', 'forgot_password', 'login']),
  code: z.string().length(6)
});

const forgotSchema = z.object({ identifier: z.string().min(3) });
const resetSchema = z.object({ identifier: z.string().min(3), otpCode: z.string().length(6), newPassword: z.string().min(8) });

function handleZodError(error: ZodError, reply: FastifyReply) {
  const firstError = error.errors[0];
  const message = firstError ? firstError.message : 'بيانات غير صحيحة';
  return reply.status(400)
    .header('Content-Type', 'application/json')
    .send({ message, details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message })) });
}

export const authController = {
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = registerSchema.parse(request.body);
      const result = await authService.register(body);
      return reply.status(201).send(result);
    } catch (e) {
      if (e instanceof ZodError) return handleZodError(e, reply);
      throw e;
    }
  },

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = loginSchema.parse(request.body);
      const result = await authService.login(request.server, {
        ...body,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip
      });
      return reply.send(result);
    } catch (e) {
      if (e instanceof ZodError) return handleZodError(e, reply);
      throw e;
    }
  },

  async verifyOtp(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = otpSchema.parse(request.body);
      const result = await authService.verifyOtp(body.destination, body.purpose, body.code);
      return reply.send(result);
    } catch (e) {
      if (e instanceof ZodError) return handleZodError(e, reply);
      throw e;
    }
  },

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = forgotSchema.parse(request.body);
      const result = await authService.forgotPassword(body.identifier);
      return reply.send(result);
    } catch (e) {
      if (e instanceof ZodError) return handleZodError(e, reply);
      throw e;
    }
  },

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = resetSchema.parse(request.body);
      const result = await authService.resetPassword(body.identifier, body.otpCode, body.newPassword);
      return reply.send(result);
    } catch (e) {
      if (e instanceof ZodError) return handleZodError(e, reply);
      throw e;
    }
  }
};
