import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  publicKeyFromSignatureRsv,
  getAddressFromPublicKey,
  createMessageSignature,
  TransactionVersion,
  validateStacksAddress,
} from '@stacks/transactions';
import User from '../models/User';
import { createError } from '../middleware/errorHandler';
import { Response } from 'express';
import { setSessionCookie, clearSessionCookie } from '../utils/sessionManager';
import {
  generateNonce,
  validateNonce,
  invalidateNonce,
} from './nonceService';
import logger from '../utils/logger';

/**
 * Generate an authentication challenge message containing a server-issued
 * nonce. The nonce is stored server-side with a 5-minute TTL and binds the
 * challenge to the requesting address to prevent cross-address replay.
 */
export const generateAuthMessage = (stacksAddress: string): string => {
  if (!validateStacksAddress(stacksAddress)) {
    throw createError('Invalid Stacks address format', 400);
  }
  const nonce = generateNonce(stacksAddress);
  return `Sign this message to authenticate with PassportX\nAddress: ${stacksAddress}\nNonce: ${nonce}`;
};

/**
 * Verify a Stacks wallet signature against a claimed address.
 *
 * Uses publicKeyFromSignatureRsv to recover the signer's public key from
 * the RSV-formatted signature, derives the Stacks address from that key,
 * and confirms it matches the claimed stacksAddress. This replaces the
 * broken verifyMessageSignatureRsv import (which does not exist in
 * @stacks/transactions v6) and correctly validates wallet ownership.
 */
export const verifySignature = async (
  message: string,
  signature: string,
  stacksAddress: string
): Promise<boolean> => {
  try {
    // Hash the message with SHA-256 — this is the hash the wallet signs.
    const messageHash = crypto
      .createHash('sha256')
      .update(message, 'utf8')
      .digest('hex');

    // Recover the signer's public key from the RSV signature.
    const messageSignature = createMessageSignature(signature);
    const recoveredPublicKey = publicKeyFromSignatureRsv(
      messageHash,
      messageSignature
    );

    // Determine the address version from the claimed address prefix.
    // SP / SM prefixes are mainnet; ST / SN are testnet.
    const isMainnet =
      stacksAddress.startsWith('SP') || stacksAddress.startsWith('SM');
    const transactionVersion = isMainnet
      ? TransactionVersion.Mainnet
      : TransactionVersion.Testnet;

    // Derive the Stacks address from the recovered public key.
    const derivedAddress = getAddressFromPublicKey(
      recoveredPublicKey,
      transactionVersion
    );

    const isValid = derivedAddress === stacksAddress;

    if (!isValid) {
      logger.warn('Signature address mismatch', {
        claimed: stacksAddress,
        derived: derivedAddress,
      });
    }

    return isValid;
  } catch (error) {
    logger.error('Signature verification failed', {
      error: error instanceof Error ? error.message : String(error),
      stacksAddress,
    });
    return false;
  }
};

export const generateToken = (
  stacksAddress: string,
  userId: string
): string => {
  return jwt.sign({ stacksAddress, userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const authenticateUser = async (
  stacksAddress: string,
  message: string,
  signature: string,
  res?: Response
) => {
  // Validate address format before doing any work.
  if (!validateStacksAddress(stacksAddress)) {
    throw createError('Invalid Stacks address format', 400);
  }

  // Extract and validate the server-issued nonce from the message.
  // Message format: "...Nonce: <64-hex-char-nonce>"
  const nonceMatch = message.match(/Nonce:\s+([a-f0-9]{64})/);
  if (!nonceMatch) {
    throw createError(
      'Invalid message format: nonce not found. Please request a new authentication message.',
      400
    );
  }
  const nonce = nonceMatch[1];

  if (!validateNonce(nonce, stacksAddress)) {
    throw createError(
      'Invalid or expired authentication nonce. Please request a new message and try again.',
      401
    );
  }

  // Verify the wallet signature.
  const isValidSignature = await verifySignature(message, signature, stacksAddress);
  if (!isValidSignature) {
    throw createError('Invalid signature', 401);
  }

  // Consume the nonce so it cannot be reused.
  invalidateNonce(nonce);

  // Find or create user.
  let user = await User.findOne({ stacksAddress });
  if (!user) {
    user = new User({
      stacksAddress,
      isPublic: true,
      joinDate: new Date(),
      lastActive: new Date(),
    });
    await user.save();
    logger.info('New user created via wallet auth', { stacksAddress });
  } else {
    user.lastActive = new Date();
    await user.save();
  }

  logger.info('User authenticated successfully', { stacksAddress });

  // Generate token.
  const token = generateToken(stacksAddress, user._id.toString());

  // Set session cookie if response object provided.
  if (res) {
    setSessionCookie(res, token);
  }

  return {
    token,
    user: {
      id: user._id,
      stacksAddress: user.stacksAddress,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      email: user.email,
      isPublic: user.isPublic,
      joinDate: user.joinDate,
      hasPassport: !!(user as any).passportId,
      communities: user.communities,
      adminCommunities: user.adminCommunities,
    },
  };
};

/**
 * Logout user and clear session cookie
 */
export const logoutUser = (res: Response) => {
  clearSessionCookie(res);
};
