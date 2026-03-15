import nodemailer, { Transporter } from 'nodemailer';
import logger from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

function buildTransport(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const config: SmtpConfig = {
    host,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  };

  return nodemailer.createTransport(config);
}

export class EmailService {
  private transporter: Transporter | null;
  private from: string;

  constructor() {
    this.transporter = buildTransport();
    this.from =
      process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'noreply@passportx.app';
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  /**
   * Verify the SMTP connection is reachable.
   * Returns true on success, false if SMTP is not configured or unreachable.
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed', { error });
      return false;
    }
  }

  async send(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      logger.warn('Email not sent: SMTP is not configured', {
        subject: options.subject,
        to: options.to,
      });
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info('Email sent', {
        to: options.to,
        subject: options.subject,
      });
    } catch (error) {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error,
      });
      throw error;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
