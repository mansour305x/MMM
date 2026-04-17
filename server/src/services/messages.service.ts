import dayjs from 'dayjs';
import { db } from '../config/database.js';
import { messagesRepository } from '../repositories/messages.repository.js';
import { smsService } from './sms.service.js';
import { messageQueue } from '../jobs/queues.js';

function renderTemplate(body: string, context: Record<string, unknown>) {
  return body.replace(/{{\s*([\u0600-\u06FFa-zA-Z0-9_]+)\s*}}/g, (_m, key) => String(context[key] ?? ''));
}

export const messagesService = {
  async sendSingle(input: {
    channel: 'sms' | 'whatsapp' | 'email';
    clientId?: string;
    phone?: string;
    body: string;
    createdBy: string;
  }) {
    const recipientPhone = input.phone ?? null;
    const row = await messagesRepository.createMessage({
      channel: input.channel,
      recipientPhone,
      recipientClientId: input.clientId ?? null,
      body: input.body,
      status: 'queued',
      createdBy: input.createdBy
    });

    await messageQueue.add('send-message', { messageId: row.id });
    return row;
  },

  async sendBulk(input: {
    channel: 'sms' | 'whatsapp' | 'email';
    body: string;
    target: { type: 'all' | 'segment' | 'ids'; ids?: string[]; region?: string };
    createdBy: string;
  }) {
    let clientsQuery = 'SELECT id, full_name, phone, email, region FROM clients';
    const values: unknown[] = [];

    if (input.target.type === 'ids' && input.target.ids?.length) {
      clientsQuery += ' WHERE id = ANY($1::uuid[])';
      values.push(input.target.ids);
    }

    if (input.target.type === 'segment' && input.target.region) {
      clientsQuery += ' WHERE region = $1';
      values.push(input.target.region);
    }

    const clients = await db.query(clientsQuery, values);

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
        body,
        status: 'queued',
        createdBy: input.createdBy
      });

      await messageQueue.add('send-message', { messageId: row.id });
      queued.push(row.id);
    }

    return { queuedCount: queued.length, messageIds: queued };
  },

  async createSchedule(input: {
    name: string;
    channel: 'sms' | 'whatsapp' | 'email';
    bodyTemplate: string;
    targetType: 'single' | 'bulk' | 'segment';
    targetPayload: unknown;
    scheduledAt: string;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrencePayload?: unknown;
    createdBy: string;
  }) {
    const row = await messagesRepository.createScheduledMessage(input);
    await messageQueue.add('dispatch-scheduled', { scheduleId: row.id }, { delay: Math.max(0, dayjs(row.next_run_at).diff(dayjs(), 'millisecond')) });
    return row;
  },

  async listMessages() {
    return messagesRepository.listMessages();
  },

  async listScheduled() {
    return messagesRepository.listScheduledMessages();
  },

  async processSingleMessage(message: {
    id: string;
    channel: 'sms' | 'whatsapp' | 'email';
    recipient_phone: string;
    body: string;
  }) {
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
  }
};
