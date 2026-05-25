import { Request, Response, NextFunction } from 'express';
import { validateNotificationInput } from '../middleware/notificationMiddleware';

// Mock the logger
jest.mock('../utils/logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}));

describe('validateNotificationInput Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      ip: '127.0.0.1',
      get: jest.fn(),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Type Validation', () => {
    it('should reject when type is missing', () => {
      mockRequest.body = {
        title: 'Test Title',
        message: 'Test Message',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid notification type',
        details: 'Type must be a non-empty string',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when type is not a string', () => {
      mockRequest.body = {
        type: 123,
        title: 'Test Title',
        message: 'Test Message',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept valid type', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        message: 'Test Message',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Title Validation', () => {
    it('should reject when title is missing', () => {
      mockRequest.body = {
        type: 'badge_issued',
        message: 'Test Message',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Title is required',
        details: 'Title must be a non-empty string',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when title is empty string', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: '   ',
        message: 'Test Message',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept valid title', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        message: 'Test Message',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Message Validation', () => {
    it('should reject when message is missing', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Message is required',
        details: 'Message must be a non-empty string',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when message is empty string', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        message: '   ',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept valid message', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        message: 'Test Message',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Channels Validation', () => {
    it('should reject when channels is missing', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        message: 'Test Message',
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'At least one channel is required',
        details: 'Channels must be a non-empty array',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when channels is empty array', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        message: 'Test Message',
        channels: [],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject when channels contains invalid values', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        message: 'Test Message',
        channels: ['invalid_channel'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept valid channels', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        message: 'Test Message',
        channels: ['in_app', 'email'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept all valid channel types', () => {
      const validChannels = ['in_app', 'email', 'websocket'];

      validChannels.forEach((channel) => {
        mockRequest.body = {
          type: 'badge_issued',
          title: 'Test Title',
          message: 'Test Message',
          channels: [channel],
        };

        validateNotificationInput(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalled();
        mockNext.mockClear();
      });
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML tags from title', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: '<script>alert("xss")</script>Title',
        message: 'Test Message',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body.title).not.toContain('<script>');
      expect(mockRequest.body.title).not.toContain('</script>');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize javascript: protocol from message', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        message: 'javascript:alert("xss")Test Message',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body.message).not.toContain('javascript:');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should sanitize inline event handlers', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test onclick=alert("xss") Title',
        message: 'Test Message',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body.title).not.toContain('onclick=');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', () => {
      // Simulate an error by making req.body throw
      Object.defineProperty(mockRequest, 'body', {
        get: () => {
          throw new Error('Unexpected error');
        },
      });

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error during validation',
        details:
          'An unexpected error occurred while validating the notification',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Successful Validation', () => {
    it('should call next() when all validations pass', () => {
      mockRequest.body = {
        type: 'badge_issued',
        title: 'Test Title',
        message: 'Test Message',
        channels: ['in_app', 'email', 'websocket'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should sanitize all string inputs', () => {
      mockRequest.body = {
        type: '  badge_issued  ',
        title: '  Test Title  ',
        message: '  Test Message  ',
        channels: ['in_app'],
      };

      validateNotificationInput(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.body.type).toBe('badge_issued');
      expect(mockRequest.body.title).toBe('Test Title');
      expect(mockRequest.body.message).toBe('Test Message');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
