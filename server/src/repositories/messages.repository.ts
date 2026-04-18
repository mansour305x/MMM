import { db } from '../config/database.js';

export const messagesRepository = {
  async findById(messageId: string, stateName?: string | null, isGlobalScope = false) {
    const { rows } = await db.query(
      'SELECT * FROM sms_messages WHERE id = $1 AND ($2::boolean = TRUE OR state_name = $3) LIMIT 1',
      [messageId, isGlobalScope, stateName ?? null]
    );
    return rows[0] ?? null;
  },

  async createMessage(input: {
    channel: 'sms' | 'whatsapp' | 'email';
    recipientPhone: string | null;
    recipientClientId: string | null;
    stateName?: string | null;
    body: string;
    status?: string;
    createdBy: string;
    scheduledMessageId?: string | null;
  }) {
    const query = `
      INSERT INTO sms_messages(channel, sender_id, recipient_phone, recipient_client_id, state_name, body, status, created_by, scheduled_message_id)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      input.channel,
      'MMM',
      input.recipientPhone,
      input.recipientClientId,
      input.stateName ?? null,
      input.body,
      input.status ?? 'pending',
      input.createdBy,
      input.scheduledMessageId ?? null
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async updateMessageStatus(messageId: string, status: string, patch?: { providerMessageId?: string; errorCode?: string; errorMessage?: string }) {
    const query = `
      UPDATE sms_messages
      SET status = $2::message_status,
          provider_message_id = COALESCE($3, provider_message_id),
          error_code = COALESCE($4, error_code),
          error_message = COALESCE($5, error_message),
          sent_at = CASE WHEN $2::message_status = 'sent'::message_status THEN now() ELSE sent_at END
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await db.query(query, [messageId, status, patch?.providerMessageId ?? null, patch?.errorCode ?? null, patch?.errorMessage ?? null]);
    return rows[0] ?? null;
  },

  async listMessages(stateName?: string | null, isGlobalScope = false) {
    const { rows } = await db.query(
      'SELECT * FROM sms_messages WHERE ($1::boolean = TRUE OR state_name = $2) ORDER BY created_at DESC',
      [isGlobalScope, stateName ?? null]
    );
    return rows;
  },

  async createScheduledMessage(input: {
    name: string;
    channel: 'sms' | 'whatsapp' | 'email';
    stateName?: string | null;
    bodyTemplate: string;
    targetType: 'single' | 'bulk' | 'segment';
    targetPayload: unknown;
    scheduledAt: string;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrencePayload?: unknown;
    createdBy: string;
  }) {
    const query = `
      INSERT INTO scheduled_messages(name, channel, body_template, state_name, target_type, target_payload, scheduled_at, recurrence, recurrence_payload, next_run_at, created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$7,$10)
      RETURNING *
    `;
    const values = [
      input.name,
      input.channel,
      input.bodyTemplate,
      input.stateName ?? null,
      input.targetType,
      JSON.stringify(input.targetPayload),
      input.scheduledAt,
      input.recurrence,
      JSON.stringify(input.recurrencePayload ?? null),
      input.createdBy
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async listScheduledMessages(stateName?: string | null, isGlobalScope = false) {
    const { rows } = await db.query(
      'SELECT * FROM scheduled_messages WHERE ($1::boolean = TRUE OR state_name = $2) ORDER BY created_at DESC',
      [isGlobalScope, stateName ?? null]
    );
    return rows;
  },

  async dueScheduledMessages() {
    const query = `
      SELECT *
      FROM scheduled_messages
      WHERE active = TRUE
        AND next_run_at IS NOT NULL
        AND next_run_at <= now()
      ORDER BY next_run_at ASC
      LIMIT 100
    `;
    const { rows } = await db.query(query);
    return rows;
  },

  async markScheduleRun(scheduleId: string, nextRunAt: string | null) {
    const query = `
      UPDATE scheduled_messages
      SET last_run_at = now(),
          next_run_at = $2::timestamptz,
          updated_at = now(),
          active = CASE WHEN $2::timestamptz IS NULL THEN FALSE ELSE active END
      WHERE id = $1
    `;
    await db.query(query, [scheduleId, nextRunAt]);
  }
};
