import dayjs from 'dayjs';
import { db } from '../config/database.js';
import { messagesRepository } from '../repositories/messages.repository.js';
import { smsService } from './sms.service.js';
import { messageQueue } from '../jobs/queues.js';
import { AppError } from '../middleware/error-handler.js';

function renderTemplate(body: string, context: Record<string, unknown>) {
  return body.replace(/{{\s*([\u0600-\u06FFa-zA-Z0-9_]+)\s*}}/g, (_m, key) => String(context[key] ?? ''));
}

export const messagesService = {
  async sendSingle(input: {
    channel: 'sms' | 'whatsapp' | 'email';
    clientId?: string;
    phone?: string;
    stateName: string | null;
    body: string;
    createdBy: string;
  }) {
    // Validate inputs
    if (!input.body || input.body.trim().length === 0) {
      throw new AppError(422, 'نص الرسالة مطلوب');
    }

    if (!input.clientId && !input.phone) {
      throw new AppError(422, 'رقم الهاتف أو معرّف العميل مطلوب');
    }

    const recipientPhone = input.phone ?? null;
    const row = await messagesRepository.createMessage({
      channel: input.channel,
      recipientPhone,
      recipientClientId: input.clientId ?? null,
      stateName: input.stateName,
      body: input.body,
      status: 'queued',
      createdBy: input.createdBy
    });

    if (!row) {
      throw new AppError(500, 'فشل إنشاء الرسالة');
    }

    await messageQueue.add('send-message', { messageId: row.id });
    return row;
  },

  async sendBulk(input: {
    channel: 'sms' | 'whatsapp' | 'email';
    stateName: string | null;
    isGlobalScope: boolean;
    body: string;
    target: { type: 'all' | 'segment' | 'ids'; ids?: string[]; region?: string };
    createdBy: string;
  }) {
    // Validate inputs
    if (!input.body || input.body.trim().length === 0) {
      throw new AppError(422, 'نص الرسالة مطلوب');
    }

    if (input.target.type === 'ids' && (!input.target.ids || input.target.ids.length === 0)) {
      throw new AppError(422, 'قائمة معرفات العملاء مطلوبة');
    }

    let clientsQuery = 'SELECT id, full_name, phone, email, region, state_name FROM clients WHERE ($1::boolean = TRUE OR state_name = $2)';
    const values: unknown[] = [];
    values.push(input.isGlobalScope, input.stateName ?? null);

    if (input.target.type === 'ids' && input.target.ids?.length) {
      clientsQuery += ' AND id = ANY($3::uuid[])';
      values.push(input.target.ids);
    }

    if (input.target.type === 'segment' && input.target.region) {
      clientsQuery += ' AND region = $3';
      values.push(input.target.region);
    }

    const clients = await db.query(clientsQuery, values);

    if (clients.rows.length === 0) {
      throw new AppError(404, 'لم يتم العثور على عملاء مطابقين');
    }

    const queued = [];
    for (const client of clients.rows) {
      const body = renderTemplate(input.body, {
        الاسم: client.full_name,
        الهاتف: client.phone,
        المنطقة: client.region ?? ''
      });

      const row = await messagesRepository.createMessage({
        channel: input.channel,
        recipientPhone: client.phone,
        recipientClientId: client.id,
        stateName: client.state_name,
        body,
        status: 'queued',
        createdBy: input.createdBy
      });

      if (row) {
        await messageQueue.add('send-message', { messageId: row.id });
        queued.push(row.id);
      }
    }

    return { queuedCount: queued.length, messageIds: queued };
  },

  async createSchedule(input: {
    name: string;
    channel: 'sms' | 'whatsapp' | 'email';
    stateName: string | null;
    bodyTemplate: string;
    targetType: 'single' | 'bulk' | 'segment';
    targetPayload: unknown;
    scheduledAt: string;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrencePayload?: unknown;
    createdBy: string;
  }) {
    // Validate inputs
    if (!input.name || input.name.trim().length === 0) {
      throw new AppError(422, 'اسم الجدولة مطلوب');
    }

    if (!input.bodyTemplate || input.bodyTemplate.trim().length === 0) {
      throw new AppError(422, 'قالب الرسالة مطلوب');
    }

    const scheduleTime = dayjs(input.scheduledAt);
    if (!scheduleTime.isValid()) {
      throw new AppError(422, 'وقت الجدولة غير صحيح');
    }

    const row = await messagesRepository.createScheduledMessage(input);
    if (!row) {
      throw new AppError(500, 'فشل إنشاء جدولة الرسالة');
    }

    await messageQueue.add('dispatch-scheduled', { scheduleId: row.id }, { delay: Math.max(0, scheduleTime.diff(dayjs(), 'millisecond')) });
    return row;
  },

  async listMessages(stateName: string | null, isGlobalScope: boolean) {
    return messagesRepository.listMessages(stateName, isGlobalScope);
  },

  async listScheduled(stateName: string | null, isGlobalScope: boolean) {
    return messagesRepository.listScheduledMessages(stateName, isGlobalScope);
  },

  async processSingleMessage(message: {
    id: string;
    channel: 'sms' | 'whatsapp' | 'email';
    recipient_phone: string;
    body: string;
  }) {
    try {
      const result = await smsService.send({
        channel: message.channel,
        to: message.recipient_phone,
        body: message.body
      });

      if (result.success) {
        await messagesRepository.updateMessageStatus(message.id, 'sent', { providerMessageId: result.providerMessageId });
        return;
      }

      await messagesRepository.updateMessageStatus(message.id, 'failed', {
        errorCode: result.errorCode,
        errorMessage: result.errorMessage
      });
    } catch (err) {
      await messagesRepository.updateMessageStatus(message.id, 'failed', {
        errorCode: 'SEND_ERROR',
        errorMessage: err instanceof Error ? err.message : 'فشل غير معروف'
      });
    }
  }
};
