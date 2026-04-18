import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRoutes } from './routes/auth.routes.js';
import { usersRoutes } from './routes/users.routes.js';
import { clientsRoutes } from './routes/clients.routes.js';
import { customFieldsRoutes } from './routes/custom-fields.routes.js';
import { messagesRoutes } from './routes/messages.routes.js';
import { featuresRoutes } from './routes/features.routes.js';
import { rolesRoutes } from './routes/roles.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { featureRegistryRoutes } from './routes/feature-registry.routes.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' }
    }
  });

  const configuredOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.register(cors, {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (env.NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }

      const isConfigured = configuredOrigins.includes(origin);
      let isCodespaces = false;
      try {
        isCodespaces = /\.github\.dev$/i.test(new URL(origin).hostname);
      } catch {
        isCodespaces = false;
      }

      callback(null, isConfigured || isCodespaces);
    },
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

  const staticRoot = path.resolve(process.cwd(), '..');
  const allowedStaticFiles = new Set([
    '/',
    '/index.html',
    '/login.html',
    '/state-login.html',
    '/register.html',
    '/otp.html',
    '/dashboard.html',
    '/customers.html',
    '/fields.html',
    '/messages.html',
    '/permissions.html',
    '/settings.html',
    '/modules.html',
    '/owner-console.html'
  ]);

  app.register(fastifyStatic, {
    root: staticRoot,
    index: ['index.html'],
    prefix: '/',
    wildcard: false,
    allowedPath(filePath: string) {
      // Prevent directory traversal attacks
      if (filePath.includes('..') || filePath.includes('//') || filePath.includes('\\')) {
        return false;
      }
      
      // Normalize path
      const normalized = path.normalize(filePath).startsWith('/') ? filePath : `/${filePath}`;
      
      if (allowedStaticFiles.has(normalized)) return true;
      
      // Only allow assets and partials subdirectories
      if (normalized.startsWith('/assets/css/') || 
          normalized.startsWith('/assets/js/') || 
          normalized.startsWith('/partials/')) {
        // Prevent access to sensitive files
        if (normalized.includes('.env') || normalized.includes('package.json') || 
            normalized.includes('node_modules') || normalized.includes('dist')) {
          return false;
        }
        return true;
      }
      
      return false;
    }
  });

  app.get('/health', async () => ({ status: 'ok', service: 'mmm-api' }));

  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(usersRoutes, { prefix: '/api/users' });
  app.register(usersRoutes, { prefix: '/users' });
  app.register(rolesRoutes, { prefix: '/api/roles' });
  app.register(clientsRoutes, { prefix: '/api/clients' });
  app.register(customFieldsRoutes, { prefix: '/api/custom-fields' });
  app.register(messagesRoutes, { prefix: '/api/messages' });
  app.register(featuresRoutes, { prefix: '/api/modules' });
  app.register(featureRegistryRoutes, { prefix: '/api/feature-registry' });
  app.register(settingsRoutes, { prefix: '/api/settings' });

  app.setErrorHandler(errorHandler);

  return app;
}
