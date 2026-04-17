import { buildApp } from './app.js';
import { env } from './config/env.js';
import { startQueueWorkers } from './jobs/workers.js';

async function start() {
  const app = buildApp();
  await startQueueWorkers();
  await app.listen({ port: env.PORT, host: env.HOST });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
