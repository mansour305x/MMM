import dayjs from 'dayjs';

export interface SmsSendPayload {
  channel: 'sms' | 'whatsapp' | 'email';
  to: string;
  body: string;
}

export interface SmsSendResult {
  success: boolean;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export const smsService = {
  async send(payload: SmsSendPayload): Promise<SmsSendResult> {
    // Production-ready abstraction point for Twilio/Unifonic providers.
    // Current implementation is deterministic mock for local environments.
    if (!payload.to || payload.body.trim().length === 0) {
      return { success: false, errorCode: 'INVALID_PAYLOAD', errorMessage: 'Recipient and body are required' };
    }

    const providerMessageId = `mock_${dayjs().valueOf()}`;
    return { success: true, providerMessageId };
  }
};
