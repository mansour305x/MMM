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
    password: string;
    roleCode: 'owner' | 'supervisor' | 'member';
  }) {
    const role = await rolesRepository.findByCode(input.roleCode);
    if (!role) throw new AppError(422, 'Invalid role');

    const identifier = input.email ?? input.phone;
    if (!identifier) throw new AppError(422, 'Email or phone is required');

    const exists = await usersRepository.findByEmailOrPhone(identifier);
    if (exists) throw new AppError(409, 'User already exists');

    const passwordHash = await hashPassword(input.password);
    return usersRepository.create({
      roleId: role.id,
      fullName: input.fullName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      passwordHash
    });
  },

  async updateMyProfile(userId: string, patch: { fullName?: string; email?: string; phone?: string }) {
    const user = await usersRepository.updateProfile(userId, patch);
    if (!user) throw new AppError(404, 'User not found');
    return user;
  }
};
