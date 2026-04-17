import { customFieldsRepository } from '../repositories/custom-fields.repository.js';

export const customFieldsService = {
  async list() {
    return customFieldsRepository.list();
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
    createdBy: string;
  }) {
    return customFieldsRepository.create(input);
  }
};
