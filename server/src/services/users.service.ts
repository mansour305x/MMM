import { AppError } from '../middleware/error-handler.js';
import { usersRepository } from '../repositories/users.repository.js';
import { rolesRepository } from '../repositories/roles.repository.js';
import { hashPassword } from '../utils/crypto.js';

export const usersService = {
  async listUsers() {
    return usersRepository.list();
  },

  async createUser(input: {
    fullName: string;
    email?: string;
    phone?: string;
    username?: string;
    stateName?: string;
    isStateAccount?: boolean;
    password: string;
    roleCode: 'owner' | 'supervisor' | 'member' | 'state-owner';
  }) {
    const normalizedRole = input.roleCode === 'state-owner' ? 'supervisor' : input.roleCode;
    const role = await rolesRepository.findByCode(normalizedRole);
    if (!role) throw new AppError(422, 'Invalid role');

    const identifier = input.email ?? input.phone ?? input.username;
    if (!identifier) throw new AppError(422, 'Email or phone or username is required');

    const exists = await usersRepository.findByEmailOrPhone(identifier, input.stateName ?? null, Boolean(input.isStateAccount));
    if (exists) throw new AppError(409, 'User already exists');

    const passwordHash = await hashPassword(input.password);
    return usersRepository.create({
      roleId: role.id,
      fullName: input.fullName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      username: input.username ?? null,
      stateName: input.stateName ?? null,
      isStateAccount: input.isStateAccount ?? false,
      passwordHash
    });
  },

  async updateMyProfile(userId: string, patch: { fullName?: string; email?: string; phone?: string }) {
    const user = await usersRepository.updateProfile(userId, patch);
    if (!user) throw new AppError(404, 'User not found');
    return user;
  }
};
