import { FastifyInstance } from 'fastify';
import { usersRepository } from '../repositories/users.repository.js';
import { rolesRepository } from '../repositories/roles.repository.js';
import { AppError } from '../middleware/error-handler.js';
import { hashPassword, hashToken, verifyPassword } from '../utils/crypto.js';
import { db } from '../config/database.js';
import dayjs from 'dayjs';
import { env } from '../config/env.js';
import { otpService } from './otp.service.js';

function getRefreshExpiryDate(): string {
  const raw = env.REFRESH_EXPIRES_IN.trim();
  const match = raw.match(/^(\d+)([smhdw])$/i);
  if (!match) {
    return dayjs().add(30, 'day').toISOString();
  }

  const value = Number(match[1]);
  const unitMap: Record<string, dayjs.ManipulateType> = {
    s: 'second',
    m: 'minute',
    h: 'hour',
    d: 'day',
    w: 'week'
  };

  const unit = unitMap[match[2].toLowerCase()] || 'day';
  return dayjs().add(value, unit).toISOString();
}

function resolveScope(user: { role_code: string; state_name?: string | null; is_state_account?: boolean }) {
  const isGlobalOwner = user.role_code === 'owner' && !user.is_state_account;
  return {
    scopeType: isGlobalOwner ? 'global' as const : 'state' as const,
    stateName: user.state_name ?? null,
    isStateAccount: Boolean(user.is_state_account)
  };
}

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
    const scope = resolveScope(user);

    const accessToken = await app.jwt.sign({
      sub: user.id,
      roleCode: user.role_code,
      permissions,
      stateName: scope.stateName,
      scopeType: scope.scopeType,
      isStateAccount: scope.isStateAccount,
      type: 'access'
    });

    const refreshRaw = await app.jwt.sign(
      {
        sub: user.id,
        roleCode: user.role_code,
        permissions,
        stateName: scope.stateName,
        scopeType: scope.scopeType,
        isStateAccount: scope.isStateAccount,
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
        getRefreshExpiryDate()
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
        stateName: scope.stateName,
        scopeType: scope.scopeType,
        isStateAccount: scope.isStateAccount,
        email: user.email,
        phone: user.phone,
        username: user.username ?? null
      }
    };
  },

  async registerStateAccount(input: { stateName: string; password: string }) {
    const stateName = input.stateName.trim();
    if (!stateName) throw new AppError(422, 'State name is required');
    if (input.password.length < 8) throw new AppError(422, 'Password must be at least 8 characters');

    const role = await rolesRepository.findByCode('supervisor');
    if (!role) throw new AppError(500, 'Default state role not found');

    const existing = await usersRepository.findStateAccountByStateName(stateName);
    if (existing) throw new AppError(409, 'State account already exists');

    const passwordHash = await hashPassword(input.password);
    const username = `state:${stateName.toLowerCase()}`;

    const user = await usersRepository.create({
      roleId: role.id,
      fullName: `حساب ولاية ${stateName}`,
      email: null,
      phone: null,
      username,
      stateName,
      isStateAccount: true,
      passwordHash
    });

    return {
      created: true,
      user: {
        id: user.id,
        username,
        stateName,
        roleCode: 'supervisor'
      }
    };
  },

  async loginState(app: FastifyInstance, input: { stateName: string; password: string; userAgent?: string; ipAddress?: string }) {
    const stateName = input.stateName.trim();
    if (!stateName) throw new AppError(422, 'State name is required');

    const user = await usersRepository.findStateAccountByStateName(stateName);
    if (!user) throw new AppError(401, 'Invalid credentials');

    const validPassword = await verifyPassword(input.password, user.password_hash);
    if (!validPassword) throw new AppError(401, 'Invalid credentials');
    if (user.status !== 'active') throw new AppError(403, 'Account is not active');

    const permissions = await rolesRepository.listPermissionsByRoleId(user.role_id);
    const scope = resolveScope(user);

    const accessToken = await app.jwt.sign({
      sub: user.id,
      roleCode: user.role_code,
      permissions,
      stateName: scope.stateName,
      scopeType: scope.scopeType,
      isStateAccount: true,
      type: 'access'
    });

    const refreshToken = await app.jwt.sign(
      {
        sub: user.id,
        roleCode: user.role_code,
        permissions,
        stateName: scope.stateName,
        scopeType: scope.scopeType,
        isStateAccount: true,
        type: 'refresh'
      },
      { expiresIn: env.REFRESH_EXPIRES_IN }
    );

    await db.query(
      `
        INSERT INTO auth_refresh_tokens(user_id, token_hash, user_agent, ip_address, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [user.id, hashToken(refreshToken), input.userAgent ?? null, input.ipAddress ?? null, getRefreshExpiryDate()]
    );

    await db.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        roleCode: user.role_code,
        stateName,
        scopeType: 'state',
        isStateAccount: true,
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
