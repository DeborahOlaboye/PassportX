import { Request, Response, NextFunction } from 'express';
import { validateStacksAddress } from '@stacks/transactions';
import logger from '../utils/logger';

/**
 * Middleware: requireSignatureFields
 *
 * Validates that the request body contains all three fields required for
 * Stacks wallet signature verification: stacksAddress, message, and signature.
 * Also validates the address format before the request reaches the controller.
 *
 * Use on any route that expects a signed authentication payload.
 */
export const requireSignatureFields = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { stacksAddress, message, signature } = req.body ?? {};

  if (!stacksAddress || typeof stacksAddress !== 'string') {
    res.status(400).json({
      success: false,
      message: 'stacksAddress is required',
      code: 'MISSING_ADDRESS',
    });
    return;
  }

  if (!message || typeof message !== 'string') {
    res.status(400).json({
      success: false,
      message: 'message is required — obtain it from POST /auth/message',
      code: 'MISSING_MESSAGE',
    });
    return;
  }

  if (!signature || typeof signature !== 'string') {
    res.status(400).json({
      success: false,
      message:
        'signature is required — sign the message with your Stacks wallet',
      code: 'MISSING_SIGNATURE',
    });
    return;
  }

  if (!validateStacksAddress(stacksAddress)) {
    logger.warn('Invalid Stacks address in auth request', { stacksAddress });
    res.status(400).json({
      success: false,
      message: 'Invalid Stacks address format',
      code: 'INVALID_ADDRESS',
    });
    return;
  }

  // Sanity-check signature length: RSV-encoded secp256k1 signature is 65 bytes = 130 hex chars
  if (signature.length !== 130 || !/^[0-9a-fA-F]+$/.test(signature)) {
    res.status(400).json({
      success: false,
      message:
        'Signature must be a 130-character hex string (65-byte RSV format)',
      code: 'INVALID_SIGNATURE_FORMAT',
    });
    return;
  }

  next();
};

/**
 * Middleware: requireNonceInMessage
 *
 * Validates that the challenge message contains a nonce in the expected format.
 * Apply after requireSignatureFields.
 */
export const requireNonceInMessage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { message } = req.body ?? {};
  const noncePattern = /Nonce:\s+([a-f0-9]{64})/;

  if (!noncePattern.test(message)) {
    logger.warn('Auth message missing or malformed nonce', {
      messagePreview:
        typeof message === 'string' ? message.slice(0, 80) : message,
    });
    res.status(400).json({
      success: false,
      message:
        'Message does not contain a valid nonce. Request a new message from POST /auth/message.',
      code: 'MISSING_NONCE',
    });
    return;
  }

  next();
};
