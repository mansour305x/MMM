import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export const messageQueue = new Queue('messages', { connection: redis });
