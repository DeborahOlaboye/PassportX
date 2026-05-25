import { notificationHealthCheck } from '../../src/services/NotificationHealthCheck';

describe('Notification Health Check', () => {
  describe('performHealthCheck', () => {
    it('should return healthy status when all checks pass', async () => {
      const result = await notificationHealthCheck.performHealthCheck();
      expect(result.status).toBe('healthy');
      expect(result.message).toBe('All systems operational');
    });

    it('should return checks object', async () => {
      const result = await notificationHealthCheck.performHealthCheck();
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('websocket');
      expect(result.checks).toHaveProperty('email');
      expect(result.checks).toHaveProperty('queue');
    });
  });
});
