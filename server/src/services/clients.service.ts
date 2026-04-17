import { AppError } from '../middleware/error-handler.js';
import { clientsRepository } from '../repositories/clients.repository.js';
import { customFieldsRepository } from '../repositories/custom-fields.repository.js';

export const clientsService = {
  async list(search?: string) {
    return clientsRepository.list(search);
  },

  async create(input: {
    fullName: string;
    nationalId: string;
    phone: string;
    email?: string;
    region?: string;
    status?: string;
    createdBy: string;
    dynamicValues?: Array<{ fieldId: string; value?: unknown }>;
  }) {
    const client = await clientsRepository.create(input);
    if (input.dynamicValues?.length) {
      await customFieldsRepository.upsertClientFieldValues(
        client.id,
        input.dynamicValues.map((item) => ({ fieldId: item.fieldId, value: item.value ?? null }))
      );
    }
    return client;
  },

  async update(clientId: string, patch: {
    fullName?: string;
    nationalId?: string;
    phone?: string;
    email?: string;
    region?: string;
    status?: string;
    dynamicValues?: Array<{ fieldId: string; value?: unknown }>;
  }) {
    const client = await clientsRepository.update(clientId, patch);
    if (!client) throw new AppError(404, 'Client not found');

    if (patch.dynamicValues?.length) {
      await customFieldsRepository.upsertClientFieldValues(
        clientId,
        patch.dynamicValues.map((item) => ({ fieldId: item.fieldId, value: item.value ?? null }))
      );
    }

    return client;
  },

  async remove(clientId: string) {
    const client = await clientsRepository.findById(clientId);
    if (!client) throw new AppError(404, 'Client not found');
    await clientsRepository.remove(clientId);
    return { deleted: true };
  },

  async withDynamicValues(clientId: string) {
    const client = await clientsRepository.findById(clientId);
    if (!client) throw new AppError(404, 'Client not found');

    const dynamicValues = await customFieldsRepository.getClientValues(clientId);
    return { client, dynamicValues };
  }
};
