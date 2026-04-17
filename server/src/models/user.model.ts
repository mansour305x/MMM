export interface User {
  id: string;
  roleId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  status: 'active' | 'suspended' | 'deleted';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileUpdate {
  fullName?: string;
  phone?: string;
  email?: string;
}
