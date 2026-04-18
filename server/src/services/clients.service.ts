import { AppError } from '../middleware/error-handler.js';
import { clientsRepository } from '../repositories/clients.repository.js';
import { customFieldsRepository } from '../repositories/custom-fields.repository.js';

export const clientsService = {
  async list(search: string | undefined, stateName: string | null, isGlobalScope: boolean) {
    try {
      return await clientsRepository.list(search, stateName, isGlobalScope);
    } catch (err) {
      throw new AppError(500, 'فشل في جلب قائمة العملاء');
    }
  },

  async create(input: {
    fullName: string;
    nationalId: string;
    phone: string;
    email?: string;
    region?: string;
    status?: string;
    stateName: string | null;
    isGlobalScope: boolean;
    createdBy: string;
    dynamicValues?: Array<{ fieldId: string; value?: unknown }>;
  }) {
    // Validate required fields
    if (!input.fullName || input.fullName.trim().length === 0) {
      throw new AppError(422, 'الاسم الكامل مطلوب');
    }

    if (!input.nationalId || input.nationalId.trim().length === 0) {
      throw new AppError(422, 'رقم الهوية مطلوب');
    }

    if (!input.phone || input.phone.trim().length < 8) {
      throw new AppError(422, 'رقم الهاتف غير صحيح');
    }

    try {
      const client = await clientsRepository.create({
        ...input,
        stateName: input.isGlobalScope ? input.stateName : input.stateName
      });
      if (!client) {
        throw new AppError(500, 'فشل في إنشاء العميل');
      }

      if (input.dynamicValues?.length) {
        await customFieldsRepository.upsertClientFieldValues(
          client.id,
          input.dynamicValues.map((item) => ({ fieldId: item.fieldId, value: item.value ?? null }))
        );
      }
      return client;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof Error && err.message.includes('duplicate key')) {
        throw new AppError(409, 'هذا الرقم (الهوية أو الهاتف) مسجل بالفعل');
      }
      throw new AppError(500, 'فشل في إنشاء العميل');
    }
  },

  async update(clientId: string, patch: {
    fullName?: string;
    nationalId?: string;
    phone?: string;
    email?: string;
    region?: string;
    status?: string;
    dynamicValues?: Array<{ fieldId: string; value?: unknown }>;
  }, stateName: string | null, isGlobalScope: boolean) {
    try {
      const client = await clientsRepository.update(clientId, patch, stateName, isGlobalScope);
      if (!client) throw new AppError(404, 'العميل غير موجود');

      if (patch.dynamicValues?.length) {
        await customFieldsRepository.upsertClientFieldValues(
          clientId,
          patch.dynamicValues.map((item) => ({ fieldId: item.fieldId, value: item.value ?? null }))
        );
      }

      return client;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof Error && err.message.includes('duplicate key')) {
        throw new AppError(409, 'هذا الرقم مسجل بالفعل');
      }
      throw new AppError(500, 'فشل في تحديث العميل');
    }
  },

  async remove(clientId: string, stateName: string | null, isGlobalScope: boolean) {
    try {
      const client = await clientsRepository.findById(clientId, stateName, isGlobalScope);
      if (!client) throw new AppError(404, 'العميل غير موجود');
      await clientsRepository.remove(clientId, stateName, isGlobalScope);
      return { deleted: true };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(500, 'فشل في حذف العميل');
    }
  },

  async withDynamicValues(clientId: string, stateName: string | null, isGlobalScope: boolean) {
    try {
      const client = await clientsRepository.findById(clientId, stateName, isGlobalScope);
      if (!client) throw new AppError(404, 'العميل غير موجود');

      const dynamicValues = await customFieldsRepository.getClientValues(clientId, stateName, isGlobalScope);
      return { ...client, dynamicValues };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(500, 'فشل في جلب بيانات العميل');
    }
  }
};
