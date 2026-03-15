jest.mock('nodemailer');

describe('EmailService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function mockTransport(overrides: Partial<{ sendMail: jest.Mock; verify: jest.Mock }> = {}) {
    const transport = {
      sendMail: overrides.sendMail ?? jest.fn().mockResolvedValue({}),
      verify: overrides.verify ?? jest.fn().mockResolvedValue(true),
    };
    const nodemailer = require('nodemailer');
    nodemailer.createTransport.mockReturnValue(transport);
    return transport;
  }

  describe('isConfigured()', () => {
    it('returns false when SMTP env vars are missing', () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const { EmailService } = require('../../services/EmailService');
      const svc = new EmailService();
      expect(svc.isConfigured()).toBe(false);
    });

    it('returns true when all SMTP env vars are set', () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'secret';

      mockTransport();

      const { EmailService } = require('../../services/EmailService');
      const svc = new EmailService();
      expect(svc.isConfigured()).toBe(true);
    });
  });

  describe('send()', () => {
    it('returns without throwing when SMTP is not configured', async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const { EmailService } = require('../../services/EmailService');
      const svc = new EmailService();

      await expect(
        svc.send({ to: 'a@b.com', subject: 'Test', text: 'Hello' })
      ).resolves.toBeUndefined();
    });

    it('calls sendMail with correct fields', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'secret';
      process.env.SMTP_FROM = 'noreply@passportx.app';

      const { sendMail } = mockTransport();
      const { EmailService } = require('../../services/EmailService');
      const svc = new EmailService();

      await svc.send({
        to: 'recipient@example.com',
        subject: 'Hello',
        text: 'Plain text',
        html: '<p>HTML</p>',
      });

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@passportx.app',
          to: 'recipient@example.com',
          subject: 'Hello',
          text: 'Plain text',
          html: '<p>HTML</p>',
        })
      );
    });

    it('joins multiple recipients with a comma', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'secret';

      const { sendMail } = mockTransport();
      const { EmailService } = require('../../services/EmailService');
      const svc = new EmailService();

      await svc.send({
        to: ['a@example.com', 'b@example.com'],
        subject: 'Multi',
        text: 'Body',
      });

      expect(sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'a@example.com, b@example.com' })
      );
    });

    it('re-throws errors from sendMail', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'secret';

      mockTransport({ sendMail: jest.fn().mockRejectedValue(new Error('SMTP error')) });
      const { EmailService } = require('../../services/EmailService');
      const svc = new EmailService();

      await expect(
        svc.send({ to: 'a@b.com', subject: 'Fail', text: 'x' })
      ).rejects.toThrow('SMTP error');
    });
  });

  describe('verifyConnection()', () => {
    it('returns false when SMTP is not configured', async () => {
      delete process.env.SMTP_HOST;
      const { EmailService } = require('../../services/EmailService');
      const svc = new EmailService();
      expect(await svc.verifyConnection()).toBe(false);
    });

    it('returns true when verify() resolves', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'secret';

      mockTransport({ verify: jest.fn().mockResolvedValue(true) });
      const { EmailService } = require('../../services/EmailService');
      const svc = new EmailService();
      expect(await svc.verifyConnection()).toBe(true);
    });

    it('returns false when verify() rejects', async () => {
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'secret';

      mockTransport({
        verify: jest.fn().mockRejectedValue(new Error('Connection refused')),
      });
      const { EmailService } = require('../../services/EmailService');
      const svc = new EmailService();
      expect(await svc.verifyConnection()).toBe(false);
    });
  });
});
