import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { rolesService } from '../services/roles.service.js';

const patchSchema = z.object({
  permissionCodes: z.array(z.string().min(3)).min(0)
});

export const rolesController = {
  async list(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await rolesService.listRoles());
  },

  async updatePermissions(request: FastifyRequest, reply: FastifyReply) {
    const params = z.object({ roleCode: z.string().min(2) }).parse(request.params);
    const body = patchSchema.parse(request.body);
    const result = await rolesService.updateRolePermissions(params.roleCode, body.permissionCodes);
    return reply.send(result);
  }
};
