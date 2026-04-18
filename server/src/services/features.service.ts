import { AppError } from '../middleware/error-handler.js';
import { modulesRepository } from '../repositories/modules.repository.js';

export const featuresService = {
  async list(stateName: string | null, isGlobalScope: boolean) {
    return modulesRepository.list(stateName, isGlobalScope);
  },

  async create(input: { code: string; name: string; description?: string; enabled?: boolean; stateName?: string | null; createdBy: string }) {
    return modulesRepository.create(input);
  },

  async toggle(moduleId: string, enabled: boolean) {
    const moduleRow = await modulesRepository.setEnabled(moduleId, enabled);
    if (!moduleRow) throw new AppError(404, 'Module not found');
    return moduleRow;
  }
};
