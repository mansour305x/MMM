import { customFieldsRepository } from '../repositories/custom-fields.repository.js';

export const customFieldsService = {
  async list(stateName: string | null, isGlobalScope: boolean) {
    return customFieldsRepository.list(stateName, isGlobalScope);
  },

  async create(input: {
    fieldKey: string;
    label: string;
    type: 'text' | 'number' | 'phone' | 'email' | 'date' | 'select' | 'checkbox' | 'textarea' | 'url';
    required: boolean;
    uniqueValue: boolean;
    showInList: boolean;
    filterable: boolean;
    optionsJson: unknown;
    sortOrder: number;
    stateName?: string | null;
    createdBy: string;
  }) {
    return customFieldsRepository.create(input);
  }
};
