import request from 'supertest';
import express from 'express';
import { verificationRateLimit } from '../../middleware/verificationValidation';

const app = express();
app.use(express.json());
app.use(verificationRateLimit);
app.get('/test', (_req, res) => res.json({ ok: true }));

describe('verificationRateLimit middleware', () => {
  it('is a real express-rate-limit middleware (not a no-op)', () => {
    expect(typeof verificationRateLimit).toBe('function');
    // A no-op next()-only function has arity 3 and no extra properties.
    // express-rate-limit attaches resetKey and other helpers to the returned fn.
    expect(typeof (verificationRateLimit as any).resetKey).toBe('function');
  });

  it('sets RateLimit-* standard headers on responses', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    // express-rate-limit with standardHeaders:true sets RateLimit-Limit
    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });

  it('allows requests under the limit', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
