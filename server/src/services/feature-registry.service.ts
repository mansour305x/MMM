import { AppError } from '../middleware/error-handler.js';
import { featureRegistryRepository } from '../repositories/feature-registry.repository.js';

export const featureRegistryService = {
  async list(stateName: string | null, includeDisabled: boolean, isGlobalScope: boolean) {
    return featureRegistryRepository.list(stateName, includeDisabled, isGlobalScope);
  },

  async create(input: {
    kind: 'feature' | 'page' | 'button' | 'action';
    code: string;
    name: string;
    description?: string;
    stateName?: string | null;
    configJson?: unknown;
    enabled?: boolean;
    createdBy: string;
    isGlobalScope: boolean;
  }) {
    if (!input.isGlobalScope) throw new AppError(403, 'Owner access required');
    return featureRegistryRepository.create(input);
  },

  async toggle(id: string, enabled: boolean, isGlobalScope: boolean) {
    if (!isGlobalScope) throw new AppError(403, 'Owner access required');
    const row = await featureRegistryRepository.setEnabled(id, enabled);
    if (!row) throw new AppError(404, 'Feature entry not found');
    return row;
  }
};
