import dayjs from 'dayjs';
import { db } from '../config/database.js';
import { env } from '../config/env.js';
import { hashPassword, randomDigits, verifyPassword } from '../utils/crypto.js';

export const otpService = {
  async generate(destination: string, purpose: 'register' | 'forgot_password' | 'login', userId: string | null = null) {
    const code = randomDigits(6);
    const otpHash = await hashPassword(code);
    const expiresAt = dayjs().add(env.OTP_TTL_SECONDS, 'second').toISOString();

    await db.query(
      `
        INSERT INTO auth_otps(user_id, destination, purpose, otp_hash, expires_at)
        VALUES($1, $2, $3, $4, $5)
      `,
      [userId, destination, purpose, otpHash, expiresAt]
    );

    return { code, expiresAt };
  },

  async verify(destination: string, purpose: 'register' | 'forgot_password' | 'login', code: string) {
    const query = `
      SELECT *
      FROM auth_otps
      WHERE destination = $1
        AND purpose = $2
        AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const { rows } = await db.query(query, [destination, purpose]);
    const otp = rows[0];
    if (!otp) return { valid: false, reason: 'OTP_NOT_FOUND' };

    if (dayjs(otp.expires_at).isBefore(dayjs())) {
      return { valid: false, reason: 'OTP_EXPIRED' };
    }

    const matched = await verifyPassword(code, otp.otp_hash);
    if (!matched) {
      await db.query('UPDATE auth_otps SET attempts = attempts + 1 WHERE id = $1', [otp.id]);
      return { valid: false, reason: 'OTP_INVALID' };
    }

    await db.query('UPDATE auth_otps SET consumed_at = now() WHERE id = $1', [otp.id]);
    return { valid: true, userId: otp.user_id as string | null };
  }
};
