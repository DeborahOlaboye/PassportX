import nodemailer from 'nodemailer';
import { Notification, NotificationChannel } from '../../src/types/notification';

export class EmailNotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendNotificationEmail(
    userEmail: string,
    notification: Notification
  ): Promise<void> {
    if (!notification.channels.includes(NotificationChannel.EMAIL)) {
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@passportx.app',
      to: userEmail,
      subject: notification.title,
      html: this.generateEmailHTML(notification),
    };

    await this.transporter.sendMail(mailOptions);
  }

  private generateEmailHTML(notification: Notification): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PassportX Notification</h1>
          </div>
          <div class="content">
            <h2>${notification.title}</h2>
            <p>${notification.message}</p>
            <p><small>${new Date(notification.createdAt).toLocaleString()}</small></p>
          </div>
          <div class="footer">
            <p>You received this notification because you have enabled email notifications for this type.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
