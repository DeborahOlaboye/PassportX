import { validateNotificationInput } from '../../src/middleware/notificationMiddleware';

describe('Notification Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('validateNotificationInput', () => {
    it('should pass validation with valid input', () => {
      mockReq.body = {
        type: 'badge_minted',
        title: 'Test Notification',
        message: 'Test message',
        channels: ['in_app'],
      };

      validateNotificationInput(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject invalid notification type', () => {
      mockReq.body = {
        type: 123,
        title: 'Test',
        message: 'Test message',
        channels: ['in_app'],
      };

      validateNotificationInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid notification type' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing title', () => {
      mockReq.body = {
        type: 'badge_minted',
        message: 'Test message',
        channels: ['in_app'],
      };

      validateNotificationInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Title is required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject empty title', () => {
      mockReq.body = {
        type: 'badge_minted',
        title: '   ',
        message: 'Test message',
        channels: ['in_app'],
      };

      validateNotificationInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Title is required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing channels', () => {
      mockReq.body = {
        type: 'badge_minted',
        title: 'Test',
        message: 'Test message',
      };

      validateNotificationInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'At least one channel is required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid channels', () => {
      mockReq.body = {
        type: 'badge_minted',
        title: 'Test',
        message: 'Test message',
        channels: ['invalid_channel'],
      };

      validateNotificationInput(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid channels: invalid_channel' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
