import '@fastify/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    userContext?: {
      userId: string;
      roleCode: string;
      permissions: string[];
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      roleCode: string;
      permissions: string[];
      type: 'access' | 'refresh';
    };
    user: {
      sub: string;
      roleCode: string;
      permissions: string[];
      type: 'access' | 'refresh';
    };
  }
}
