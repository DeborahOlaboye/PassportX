/**
 * Tests confirming that DELETE activity endpoints require authentication
 * and enforce ownership to prevent IDOR vulnerabilities.
 */
import express from 'express';
import request from 'supertest';
import activityRouter, { setUserActivityService } from '../../routes/activity';

// Mock auth middleware — captures whether it was called
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req: any, _res: any, next: any) => {
    // Simulate authenticated user
    req.user = { stacksAddress: 'SP_ALICE', userId: 'user-alice' };
    next();
  }),
}));

jest.mock('../../utils/logger', () => ({
  default: { error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { authenticateToken } from '../../middleware/auth';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/activity', activityRouter);
  return app;
};

const makeService = (overrides: Record<string, jest.Mock> = {}) => ({
  deleteActivityForUser: jest.fn().mockResolvedValue(true),
  clearUserActivities: jest.fn().mockResolvedValue(3),
  getUserActivityFeed: jest.fn(),
  markActivityAsRead: jest.fn(),
  markAllActivitiesAsRead: jest.fn(),
  getUnreadCount: jest.fn(),
  ...overrides,
});

describe('Activity route DELETE endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /activity/:activityId', () => {
    it('calls authenticateToken middleware', async () => {
      const svc = makeService();
      setUserActivityService(svc as any);
      const app = buildApp();

      await request(app).delete('/activity/activity-123');

      expect(authenticateToken).toHaveBeenCalled();
    });

    it('returns 403 when activity is owned by a different user', async () => {
      const svc = makeService({
        deleteActivityForUser: jest.fn().mockResolvedValue(null),
      });
      setUserActivityService(svc as any);
      const app = buildApp();

      const res = await request(app).delete('/activity/activity-123');

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden/);
    });

    it('returns success when activity is owned by the requester', async () => {
      const svc = makeService({
        deleteActivityForUser: jest.fn().mockResolvedValue(true),
      });
      setUserActivityService(svc as any);
      const app = buildApp();

      const res = await request(app).delete('/activity/activity-123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(svc.deleteActivityForUser).toHaveBeenCalledWith(
        'activity-123',
        'SP_ALICE'
      );
    });
  });

  describe('DELETE /activity/user/:userId', () => {
    it('calls authenticateToken middleware', async () => {
      const svc = makeService();
      setUserActivityService(svc as any);
      const app = buildApp();

      await request(app).delete('/activity/user/SP_ALICE');

      expect(authenticateToken).toHaveBeenCalled();
    });

    it('returns 403 when userId does not match the authenticated user', async () => {
      const svc = makeService();
      setUserActivityService(svc as any);
      const app = buildApp();

      // SP_ALICE is authenticated but tries to clear SP_BOB's activities
      const res = await request(app).delete('/activity/user/SP_BOB');

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Forbidden/);
    });

    it('clears activities when userId matches the authenticated user', async () => {
      const svc = makeService();
      setUserActivityService(svc as any);
      const app = buildApp();

      const res = await request(app).delete('/activity/user/SP_ALICE');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(svc.clearUserActivities).toHaveBeenCalledWith('SP_ALICE');
    });
  });
});
