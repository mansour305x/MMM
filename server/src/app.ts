import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRoutes } from './routes/auth.routes.js';
import { usersRoutes } from './routes/users.routes.js';
import { clientsRoutes } from './routes/clients.routes.js';
import { customFieldsRoutes } from './routes/custom-fields.routes.js';
import { messagesRoutes } from './routes/messages.routes.js';
import { featuresRoutes } from './routes/features.routes.js';
import { rolesRoutes } from './routes/roles.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' }
    }
  });

  // CORS Configuration - Allow all origins in development, specific in production
  const corsOrigins = env.NODE_ENV === 'production' 
    ? env.CORS_ORIGIN 
    : [/localhost/, /127.0.0.1/, /^https?:\/\/[a-z0-9\-\.]+$/i];

  app.register(cors, { 
    origin: corsOrigins, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  app.register(helmet);
  app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: env.RATE_LIMIT_WINDOW });

  app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN }
  });

  app.get('/health', async () => ({ status: 'ok', service: 'mmm-api' }));

  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(usersRoutes, { prefix: '/api/users' });
  app.register(rolesRoutes, { prefix: '/api/roles' });
  app.register(clientsRoutes, { prefix: '/api/clients' });
  app.register(customFieldsRoutes, { prefix: '/api/custom-fields' });
  app.register(messagesRoutes, { prefix: '/api/messages' });
  app.register(featuresRoutes, { prefix: '/api/modules' });

  app.setErrorHandler(errorHandler);

  return app;
}
