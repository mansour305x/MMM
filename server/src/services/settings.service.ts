import { AppError } from '../middleware/error-handler.js';
import { settingsRepository } from '../repositories/settings.repository.js';

export const settingsService = {
  async get(stateName: string | null) {
    if (!stateName) throw new AppError(422, 'State name is required');
    const row = await settingsRepository.getByState(stateName);
    if (!row) return { stateName, settingsJson: {} };
    return row;
  },

  async update(stateName: string | null, settingsJson: unknown, userId: string) {
    if (!stateName) throw new AppError(422, 'State name is required');
    return settingsRepository.upsertByState(stateName, settingsJson, userId);
  }
};
