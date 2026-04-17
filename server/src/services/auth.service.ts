import { FastifyInstance } from 'fastify';
import { usersRepository } from '../repositories/users.repository.js';
import { rolesRepository } from '../repositories/roles.repository.js';
import { AppError } from '../middleware/error-handler.js';
import { hashPassword, hashToken, verifyPassword } from '../utils/crypto.js';
import { db } from '../config/database.js';
import dayjs from 'dayjs';
import { env } from '../config/env.js';
import { otpService } from './otp.service.js';

export const authService = {
  async register(input: { fullName: string; email?: string; phone?: string; password: string }) {
    const role = await rolesRepository.findByCode('member');
    if (!role) throw new AppError(500, 'Default role not found');

    const identifier = input.email ?? input.phone;
    if (!identifier) throw new AppError(422, 'Email or phone is required');

    const exists = await usersRepository.findByEmailOrPhone(identifier);
    if (exists) throw new AppError(409, 'User already exists');

    const passwordHash = await hashPassword(input.password);
    const user = await usersRepository.create({
      roleId: role.id,
      fullName: input.fullName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      passwordHash
    });

    const otpDestination = input.email ?? input.phone!;
    const otp = await otpService.generate(otpDestination, 'register', user.id);

    return { user, otpCode: otp.code, otpExpiresAt: otp.expiresAt };
  },

  async login(app: FastifyInstance, input: { identifier: string; password: string; userAgent?: string; ipAddress?: string }) {
    const user = await usersRepository.findByEmailOrPhone(input.identifier);
    if (!user) throw new AppError(401, 'Invalid credentials');

    const validPassword = await verifyPassword(input.password, user.password_hash);
    if (!validPassword) throw new AppError(401, 'Invalid credentials');

    if (user.status !== 'active') throw new AppError(403, 'Account is not active');

    const permissions = await rolesRepository.listPermissionsByRoleId(user.role_id);

    const accessToken = await app.jwt.sign({
      sub: user.id,
      roleCode: user.role_code,
      permissions,
      type: 'access'
    });

    const refreshRaw = await app.jwt.sign(
      {
        sub: user.id,
        roleCode: user.role_code,
        permissions,
        type: 'refresh'
      },
      { expiresIn: env.REFRESH_EXPIRES_IN }
    );

    await db.query(
      `
        INSERT INTO auth_refresh_tokens(user_id, token_hash, user_agent, ip_address, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        user.id,
        hashToken(refreshRaw),
        input.userAgent ?? null,
        input.ipAddress ?? null,
        dayjs().add(30, 'day').toISOString()
      ]
    );

    await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

    return {
      accessToken,
      refreshToken: refreshRaw,
      user: {
        id: user.id,
        fullName: user.full_name,
        roleCode: user.role_code,
        email: user.email,
        phone: user.phone
      }
    };
  },

  async verifyOtp(destination: string, purpose: 'register' | 'forgot_password' | 'login', code: string) {
    const result = await otpService.verify(destination, purpose, code);
    if (!result.valid) throw new AppError(422, `OTP verification failed: ${result.reason}`);

    if (result.userId) {
      await db.query(
        `
          UPDATE users
          SET
            is_email_verified = CASE WHEN email = $2 THEN TRUE ELSE is_email_verified END,
            is_phone_verified = CASE WHEN phone = $2 THEN TRUE ELSE is_phone_verified END,
            updated_at = now()
          WHERE id = $1
        `,
        [result.userId, destination]
      );
    }

    return { verified: true };
  },

  async forgotPassword(identifier: string) {
    const user = await usersRepository.findByEmailOrPhone(identifier);
    if (!user) throw new AppError(404, 'User not found');
    const otp = await otpService.generate(identifier, 'forgot_password', user.id);
    return { sent: true, otpCode: otp.code, otpExpiresAt: otp.expiresAt };
  },

  async resetPassword(identifier: string, otpCode: string, newPassword: string) {
    const verify = await otpService.verify(identifier, 'forgot_password', otpCode);
    if (!verify.valid || !verify.userId) throw new AppError(422, 'Invalid OTP');

    const passwordHash = await hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [verify.userId, passwordHash]);

    return { updated: true };
  }
};
