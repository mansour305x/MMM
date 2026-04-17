import dayjs from 'dayjs';
import { db } from '../config/database.js';
import { messagesRepository } from '../repositories/messages.repository.js';
import { messageQueue } from './queues.js';

function computeNextRun(current: dayjs.Dayjs, recurrence: 'none' | 'daily' | 'weekly' | 'monthly'): string | null {
  if (recurrence === 'none') return null;
  if (recurrence === 'daily') return current.add(1, 'day').toISOString();
  if (recurrence === 'weekly') return current.add(1, 'week').toISOString();
  return current.add(1, 'month').toISOString();
}

export async function dispatchScheduledMessage(scheduleId: string): Promise<void> {
  const { rows } = await db.query('SELECT * FROM scheduled_messages WHERE id = $1 AND active = TRUE LIMIT 1', [scheduleId]);
  const schedule = rows[0];
  if (!schedule) return;

  const clientsQuery = `
    SELECT id, full_name, phone, region
    FROM clients
    WHERE CASE
      WHEN $1 = 'single' THEN id = ($2::jsonb->>'clientId')::uuid
      WHEN $1 = 'segment' THEN region = ($2::jsonb->>'region')
      ELSE TRUE
    END
  `;

  const clients = await db.query(clientsQuery, [schedule.target_type, schedule.target_payload]);

  for (const client of clients.rows) {
    const row = await messagesRepository.createMessage({
      channel: schedule.channel,
      recipientPhone: client.phone,
      recipientClientId: client.id,
      body: schedule.body_template
        .replaceAll('{{الاسم}}', client.full_name)
        .replaceAll('{{الهاتف}}', client.phone)
        .replaceAll('{{المنطقة}}', client.region ?? ''),
      status: 'queued',
      createdBy: schedule.created_by,
      scheduledMessageId: schedule.id
    });

    await messageQueue.add('send-message', { messageId: row.id });
  }

  const nextRunAt = computeNextRun(dayjs(schedule.next_run_at ?? schedule.scheduled_at), schedule.recurrence);
  await messagesRepository.markScheduleRun(schedule.id, nextRunAt);

  if (nextRunAt) {
    await messageQueue.add('dispatch-scheduled', { scheduleId: schedule.id }, { delay: Math.max(0, dayjs(nextRunAt).diff(dayjs(), 'millisecond')) });
  }
}
