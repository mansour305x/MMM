import { Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { messagesRepository } from '../repositories/messages.repository.js';
import { messagesService } from '../services/messages.service.js';
import { dispatchScheduledMessage } from './scheduled-messages.job.js';

let started = false;

export async function startQueueWorkers(): Promise<void> {
  if (started) return;
  started = true;

  const worker = new Worker(
    'messages',
    async (job) => {
      if (job.name === 'send-message') {
        const message = await messagesRepository.findById(job.data.messageId);
        if (!message) return;
        await messagesService.processSingleMessage(message);
        return;
      }

      if (job.name === 'dispatch-scheduled') {
        await dispatchScheduledMessage(job.data.scheduleId);
      }
    },
    { connection: redis }
  );

  worker.on('failed', (_job, err) => {
    console.error('Queue worker failed', err);
  });
}
