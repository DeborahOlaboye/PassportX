import request from 'supertest';
import express from 'express';
import cors from 'cors';

jest.setTimeout(30000);

describe('CORS Configuration', () => {
  let app: express.Application;

  beforeEach(() => {
    process.env.CORS_ORIGIN = 'http://localhost:3000,https://staging.example.com,https://example.com';
    
    const allowedOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    
    app = express();
    app.use(cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }));
    
    app.get('/test', (req, res) => res.json({ success: true }));
  });

  test('should allow whitelisted origins', async () => {
    const response = await request(app)
      .get('/test')
      .set('Origin', 'http://localhost:3000');
    
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  test('should allow multiple whitelisted origins', async () => {
    const origins = ['http://localhost:3000', 'https://staging.example.com', 'https://example.com'];
    
    for (const origin of origins) {
      const response = await request(app)
        .get('/test')
        .set('Origin', origin);
      
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
    }
  });

  test('should block non-whitelisted origins', async () => {
    const response = await request(app)
      .get('/test')
      .set('Origin', 'https://malicious.com')
      .expect(500);
  });

  test('should handle preflight OPTIONS requests', async () => {
    const response = await request(app)
      .options('/test')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');
    
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });

  test('should allow requests without origin header', async () => {
    const response = await request(app).get('/test');
    expect(response.status).toBe(200);
  });

  test('should parse comma-separated origins with spaces', () => {
    const corsOrigin = 'http://localhost:3000, https://staging.com ,https://prod.com';
    const origins = corsOrigin.split(',').map(o => o.trim());
    
    expect(origins).toEqual([
      'http://localhost:3000',
      'https://staging.com',
      'https://prod.com'
    ]);
  });

  test('should default to localhost when CORS_ORIGIN is empty', () => {
    const originalValue = process.env.CORS_ORIGIN;
    delete process.env.CORS_ORIGIN;
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? (process.env.CORS_ORIGIN as string).split(',').map((origin: string) => origin.trim())
      : ['http://localhost:3000'];
    
    expect(allowedOrigins).toEqual(['http://localhost:3000']);
    
    if (originalValue) {
      process.env.CORS_ORIGIN = originalValue;
    }
  });
});
