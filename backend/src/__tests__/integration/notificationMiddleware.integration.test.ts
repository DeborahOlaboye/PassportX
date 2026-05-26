import request from 'supertest';
import express, { Express } from 'express';
import { validateNotificationInput } from '../../middleware/notificationMiddleware';

describe('Notification Middleware Integration Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Express Route Integration', () => {
    it('should work correctly when integrated with Express routes', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: 'Test Title',
          message: 'Test Message',
          channels: ['in_app'],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('badge_issued');
    });

    it('should reject invalid requests with proper error response', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: '',
          message: 'Test Message',
          channels: ['in_app'],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required');
    });
  });

  describe('Multiple Middleware Chain', () => {
    it('should work when chained with other middleware', async () => {
      const authMiddleware = (req: any, res: any, next: any) => {
        req.user = { id: 'test-user-id' };
        next();
      };

      app.post(
        '/notifications',
        authMiddleware,
        validateNotificationInput,
        (req: any, res) => {
          res
            .status(200)
            .json({ success: true, user: req.user, data: req.body });
        }
      );

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: 'Test Title',
          message: 'Test Message',
          channels: ['in_app'],
        });

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe('test-user-id');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle badge issuance notification', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: 'New Badge Earned',
          message:
            'Congratulations! You have earned the Python Beginner badge.',
          channels: ['in_app', 'email'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.type).toBe('badge_issued');
      expect(response.body.data.channels).toEqual(['in_app', 'email']);
    });

    it('should handle community invitation notification', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'community_invite',
          title: 'Community Invitation',
          message:
            'You have been invited to join the Open Code Guild community.',
          channels: ['in_app', 'websocket'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.type).toBe('community_invite');
    });

    it('should handle system announcement notification', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'system',
          title: 'System Maintenance',
          message: 'Scheduled maintenance will occur on Sunday at 2 AM UTC.',
          channels: ['in_app', 'email', 'websocket'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.channels).toEqual([
        'in_app',
        'email',
        'websocket',
      ]);
    });
  });

  describe('Security Scenarios', () => {
    it('should sanitize XSS attempts in real requests', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: '<script>alert("xss")</script>Title',
          message: 'Test Message',
          channels: ['in_app'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.title).not.toContain('</script>');
    });

    it('should handle malformed JSON gracefully', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/notifications')
        .send('invalid json');

      expect(response.status).toBe(400);
    });
  });

  describe('Performance Scenarios', () => {
    it('should handle multiple concurrent requests', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true });
      });

      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/notifications')
          .send({
            type: 'badge_issued',
            title: 'Test Title',
            message: 'Test Message',
            channels: ['in_app'],
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should accept title at the maximum length boundary', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const maxTitle = 'A'.repeat(200);

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: maxTitle,
          message: 'Test Message',
          channels: ['in_app'],
        });

      expect(response.status).toBe(200);
    });

    it('should reject title exceeding maximum length', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: 'A'.repeat(201),
          message: 'Test Message',
          channels: ['in_app'],
        });

      expect(response.status).toBe(400);
    });

    it('should handle very long messages', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const longMessage = 'B'.repeat(5000);

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: 'Test Title',
          message: longMessage,
          channels: ['in_app'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toBe(longMessage);
    });

    it('should handle maximum number of channels', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: 'Test Title',
          message: 'Test Message',
          channels: ['in_app', 'email', 'websocket'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.channels).toHaveLength(3);
    });

    it('should reject channels exceeding maximum count', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: 'Test Title',
          message: 'Test Message',
          channels: ['in_app', 'email', 'websocket', 'in_app'],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Request ID Propagation', () => {
    it('should accept requests with x-request-id header', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/notifications')
        .set('x-request-id', 'test-request-123')
        .send({
          type: 'badge_issued',
          title: 'Test Title',
          message: 'Test Message',
          channels: ['in_app'],
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Type Enum Validation', () => {
    it('should reject an unknown notification type', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'unknown_type',
          title: 'Test Title',
          message: 'Test Message',
          channels: ['in_app'],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid notification type');
    });

    it('should accept all valid notification types', async () => {
      const validTypes = [
        'badge_issued',
        'badge_revoked',
        'system',
        'announcement',
      ];

      for (const type of validTypes) {
        app.post(
          `/notifications-${type}`,
          validateNotificationInput,
          (_req, res) => {
            res.status(200).json({ success: true });
          }
        );

        const response = await request(app)
          .post(`/notifications-${type}`)
          .send({
            type,
            title: 'Test Title',
            message: 'Test Message',
            channels: ['in_app'],
          });

        expect(response.status).toBe(200);
      }
    });
  });

  describe('Injection Sanitization', () => {
    it('should strip SQL keywords from sanitized inputs', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: 'Test Title',
          message: "Hello'; DROP TABLE users; --",
          channels: ['in_app'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.message).not.toContain('DROP');
    });

    it('should strip NoSQL operators from sanitized inputs', async () => {
      app.post('/notifications', validateNotificationInput, (req, res) => {
        res.status(200).json({ success: true, data: req.body });
      });

      const response = await request(app)
        .post('/notifications')
        .send({
          type: 'badge_issued',
          title: 'Query $where: true',
          message: 'Test Message',
          channels: ['in_app'],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).not.toContain('$where');
    });
  });
});
