import { Request, Response } from 'express';
import { authenticateWithWallet } from '../authController';
import User from '../../models/User';
import { verifySignature } from '../../services/authService';
import {
  generateSessionToken,
  setSessionCookie,
} from '../../utils/sessionManager';

jest.mock('../../models/User');
jest.mock('../../services/authService');
jest.mock('../../utils/sessionManager');

const VALID_ADDRESS = 'ST123ABC';
const VALID_NONCE = 'a'.repeat(64);
const VALID_MESSAGE = `Sign this message to authenticate with PassportX\nAddress: ${VALID_ADDRESS}\nNonce: ${VALID_NONCE}`;
const VALID_SIGNATURE = 'b'.repeat(130);

describe('AuthController - Signature Verification', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = { body: {} };
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('Signature Verification', () => {
    test('should reject request without signature', async () => {
      mockRequest.body = {
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
      };

      await authenticateWithWallet(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'MISSING_SIGNATURE',
        })
      );
    });

    test('should reject request without message', async () => {
      mockRequest.body = {
        stacksAddress: VALID_ADDRESS,
        signature: VALID_SIGNATURE,
      };

      await authenticateWithWallet(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'MISSING_SIGNATURE',
        })
      );
    });

    test('should verify valid signature and authenticate user', async () => {
      const mockUser = {
        _id: 'user123',
        stacksAddress: VALID_ADDRESS,
        name: 'Test User',
        isPublic: true,
        joinDate: new Date(),
        lastActive: new Date(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
        signature: VALID_SIGNATURE,
      };

      (verifySignature as jest.Mock).mockResolvedValue(true);
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (generateSessionToken as jest.Mock).mockReturnValue('mock_token');
      (setSessionCookie as jest.Mock).mockImplementation(() => {});

      await authenticateWithWallet(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(verifySignature).toHaveBeenCalledWith(
        VALID_MESSAGE,
        VALID_SIGNATURE,
        VALID_ADDRESS
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: 'mock_token',
            user: expect.objectContaining({
              stacksAddress: VALID_ADDRESS,
            }),
          }),
        })
      );
    });

    test('should reject invalid signature', async () => {
      mockRequest.body = {
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
        signature: VALID_SIGNATURE,
      };

      (verifySignature as jest.Mock).mockResolvedValue(false);

      await authenticateWithWallet(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(verifySignature).toHaveBeenCalledWith(
        VALID_MESSAGE,
        VALID_SIGNATURE,
        VALID_ADDRESS
      );
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid signature. Please sign the message with your wallet.',
        code: 'INVALID_SIGNATURE',
      });
    });

    test('should handle signature verification errors gracefully', async () => {
      mockRequest.body = {
        stacksAddress: VALID_ADDRESS,
        message: VALID_MESSAGE,
        signature: VALID_SIGNATURE,
      };

      (verifySignature as jest.Mock).mockRejectedValue(
        new Error('Signature verification failed')
      );

      await authenticateWithWallet(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    test('should create new user if not exists with valid signature', async () => {
      const mockNewUser = {
        _id: 'newuser123',
        stacksAddress: 'ST456DEF',
        isPublic: true,
        joinDate: expect.any(Date),
        lastActive: expect.any(Date),
        save: jest.fn().mockResolvedValue(true),
      };

      mockRequest.body = {
        stacksAddress: 'ST456DEF',
        message: VALID_MESSAGE,
        signature: VALID_SIGNATURE,
      };

      (verifySignature as jest.Mock).mockResolvedValue(true);
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User as any).mockImplementation(() => mockNewUser);
      (generateSessionToken as jest.Mock).mockReturnValue('new_token');
      (setSessionCookie as jest.Mock).mockImplementation(() => {});

      await authenticateWithWallet(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(verifySignature).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({ stacksAddress: 'ST456DEF' });
      expect(mockNewUser.save).toHaveBeenCalled();
    });
  });
});
