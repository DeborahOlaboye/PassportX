import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface WebhookValidationConfig {
  enabled: boolean;
  algorithm: string;
  secretKey?: string;
}

export function validateWebhookSignature(config: WebhookValidationConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!config.enabled) {
        return next();
      }

      if (!config.secretKey) {
        console.warn('Webhook validation enabled but no secret key configured');
        return next();
      }

      const signature = req.headers['x-chainhook-signature'] as string;
      const timestamp = req.headers['x-chainhook-timestamp'] as string;

      if (!signature) {
        return res.status(401).json({
          success: false,
          error: 'Missing webhook signature',
          code: 'MISSING_SIGNATURE'
        });
      }

      if (!timestamp) {
        return res.status(401).json({
          success: false,
          error: 'Missing webhook timestamp',
          code: 'MISSING_TIMESTAMP'
        });
      }

      const requestBody = JSON.stringify(req.body);
      const message = `${timestamp}.${requestBody}`;

      const expectedSignature = crypto
        .createHmac(config.algorithm, config.secretKey)
        .update(message)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature',
          code: 'INVALID_SIGNATURE'
        });
      }

      const now = Date.now();
      const requestTime = parseInt(timestamp, 10);
      const maxAge = 5 * 60 * 1000;

      if (Math.abs(now - requestTime) > maxAge) {
        return res.status(401).json({
          success: false,
          error: 'Webhook request expired',
          code: 'EXPIRED_TIMESTAMP'
        });
      }

      next();
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate webhook signature',
        code: 'VALIDATION_ERROR'
      });
    }
  };
}

export function getWebhookValidationConfig(): WebhookValidationConfig {
  return {
    enabled: process.env.WEBHOOK_SIGNATURE_VALIDATION === 'true',
    algorithm: process.env.WEBHOOK_SIGNATURE_ALGORITHM || 'sha256',
    secretKey: process.env.WEBHOOK_SECRET_KEY
  };
}
