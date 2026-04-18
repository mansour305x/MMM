import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/auth.controller.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', authController.register);
  app.post('/login', authController.login);
  app.post('/register-state', authController.registerState);
  app.post('/login-state', authController.loginState);
  app.post('/verify-otp', authController.verifyOtp);
  app.post('/forgot-password', authController.forgotPassword);
  app.post('/reset-password', authController.resetPassword);
}
