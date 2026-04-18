import '@fastify/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    userContext?: {
      userId: string;
      roleCode: string;
      permissions: string[];
      stateName: string | null;
      scopeType: 'global' | 'state';
      isStateAccount: boolean;
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      roleCode: string;
      permissions: string[];
      stateName?: string | null;
      scopeType?: 'global' | 'state';
      isStateAccount?: boolean;
      type: 'access' | 'refresh';
    };
    user: {
      sub: string;
      roleCode: string;
      permissions: string[];
      stateName?: string | null;
      scopeType?: 'global' | 'state';
      isStateAccount?: boolean;
      type: 'access' | 'refresh';
    };
  }
}
