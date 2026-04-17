export interface AuthOtp {
  id: string;
  userId: string | null;
  destination: string;
  purpose: 'register' | 'forgot_password' | 'login';
  otpHash: string;
  attempts: number;
  expiresAt: string;
  consumedAt: string | null;
  createdAt: string;
}

export interface RefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}
