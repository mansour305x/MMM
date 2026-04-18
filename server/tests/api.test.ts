import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';

describe('MMM API', () => {
  it('health check returns ok', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok' });
  });

  it('unknown route returns 404', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/not-found' });
    expect(res.statusCode).toBe(404);
  });

  it('protected users route without token returns 401', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/users' });
    expect(res.statusCode).toBe(401);
  });
});
