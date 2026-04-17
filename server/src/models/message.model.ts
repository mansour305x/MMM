export interface SmsMessage {
  id: string;
  channel: 'sms' | 'whatsapp' | 'email';
  senderId: string | null;
  recipientPhone: string | null;
  recipientClientId: string | null;
  body: string;
  status: 'pending' | 'queued' | 'sending' | 'sent' | 'failed' | 'cancelled';
  providerMessageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attempts: number;
  scheduledMessageId: string | null;
  createdBy: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface ScheduledMessage {
  id: string;
  name: string;
  channel: 'sms' | 'whatsapp' | 'email';
  bodyTemplate: string;
  targetType: 'single' | 'bulk' | 'segment';
  targetPayload: unknown;
  scheduledAt: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrencePayload: unknown;
  active: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
