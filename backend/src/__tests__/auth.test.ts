import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth';
import { errorHandler } from '../middleware/errorHandler';
import * as authService from '../services/authService';
import * as nonceService from '../services/nonceService';

jest.mock('../services/authService');
jest.mock('../services/nonceService');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

const VALID_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const VALID_SIGNATURE = 'a'.repeat(130); // 130-char hex — passes format check
const VALID_NONCE = 'b'.repeat(64);
const VALID_MESSAGE = `Sign this message to authenticate with PassportX\nAddress: ${VALID_ADDRESS}\nNonce: ${VALID_NONCE}`;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /auth/message ────────────────────────────────────────────────────

  describe('POST /auth/message', () => {
    it('returns a nonce-bound message for a valid address', async () => {
      (authService.generateAuthMessage as jest.Mock).mockReturnValue(
        VALID_MESSAGE
      );

      const response = await request(app)
        .post('/auth/message')
        .send({ stacksAddress: VALID_ADDRESS });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Nonce:');
      expect(response.body.message).toContain(VALID_ADDRESS);
      expect(response.body.expiresInSeconds).toBe(300);
      expect(authService.generateAuthMessage).toHaveBeenCalledWith(
        VALID_ADDRESS
      );
    });

    it('returns 400 when stacksAddress is missing', async () => {
      const response = await request(app).post('/auth/message').send({});

      expect(response.status).toBe(400);
    });

    it('returns 400 when generateAuthMessage throws (invalid address)', async () => {
      (authService.generateAuthMessage as jest.Mock).mockImplementation(() => {
        throw { status: 400, message: 'Invalid Stacks address format' };
      });

      const response = await request(app)
        .post('/auth/message')
        .send({ stacksAddress: 'NOT_A_VALID_ADDRESS' });

      expect(response.status).toBe(400);
    });
  });

  // ─── POST /auth/login ──────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('returns 400 when signature is missing', async () => {
      const response = await request(app).post('/auth/login').send({
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
      });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_SIGNATURE');
    });

    it('returns 400 when message is missing', async () => {
      const response = await request(app).post('/auth/login').send({
        stacksAddress: VALID_ADDRESS,
        signature: VALID_SIGNATURE,
      });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_MESSAGE');
    });

    it('returns 400 when stacksAddress is missing', async () => {
      const response = await request(app).post('/auth/login').send({
        message: VALID_MESSAGE,
        signature: VALID_SIGNATURE,
      });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('MISSING_ADDRESS');
    });

    it('returns 400 when signature is not 130-char hex', async () => {
      const response = await request(app).post('/auth/login').send({
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
        signature: 'tooshort',
      });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_SIGNATURE_FORMAT');
    });

    it('authenticates successfully with valid fields', async () => {
      const mockResult = {
        token: 'mock_token',
        user: { stacksAddress: VALID_ADDRESS, id: 'user123' },
      };
      (authService.authenticateUser as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app).post('/auth/login').send({
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
        signature: VALID_SIGNATURE,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('mock_token');
      expect(authService.authenticateUser).toHaveBeenCalledWith(
        VALID_ADDRESS,
        VALID_MESSAGE,
        VALID_SIGNATURE,
        expect.anything()
      );
    });

    it('returns 401 when authenticateUser throws invalid signature error', async () => {
      (authService.authenticateUser as jest.Mock).mockRejectedValue({
        status: 401,
        message: 'Invalid signature',
      });

      const response = await request(app).post('/auth/login').send({
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
        signature: VALID_SIGNATURE,
      });

      expect(response.status).toBe(401);
    });

    it('returns 401 when authenticateUser throws expired nonce error', async () => {
      (authService.authenticateUser as jest.Mock).mockRejectedValue({
        status: 401,
        message: 'Invalid or expired authentication nonce',
      });

      const response = await request(app).post('/auth/login').send({
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
        signature: VALID_SIGNATURE,
      });

      expect(response.status).toBe(401);
    });
  });

  // ─── POST /auth/verify-signature ──────────────────────────────────────────

  describe('POST /auth/verify-signature', () => {
    it('returns verified: true for a valid signature', async () => {
      (authService.verifySignature as jest.Mock).mockResolvedValue(true);

      const response = await request(app).post('/auth/verify-signature').send({
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
        signature: VALID_SIGNATURE,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.verified).toBe(true);
    });

    it('returns 401 for an invalid signature', async () => {
      (authService.verifySignature as jest.Mock).mockResolvedValue(false);

      const response = await request(app).post('/auth/verify-signature').send({
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
        signature: VALID_SIGNATURE,
      });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_SIGNATURE');
    });
  });

  // ─── POST /auth/logout ─────────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('clears the session and returns success', async () => {
      (authService.logoutUser as jest.Mock).mockImplementation(() => {});

      const response = await request(app).post('/auth/logout').send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

// ─── NonceService unit tests ─────────────────────────────────────────────────

describe('NonceService', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('exports generateNonce, validateNonce, invalidateNonce', async () => {
    const { generateNonce, validateNonce, invalidateNonce } = await import(
      '../services/nonceService'
    );
    expect(typeof generateNonce).toBe('function');
    expect(typeof validateNonce).toBe('function');
    expect(typeof invalidateNonce).toBe('function');
  });
});
