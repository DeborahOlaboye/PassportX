import { BadgeMintEvent } from '../chainhook/types/handlers';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BadgeEventValidationOptions {
  requireBadgeId?: boolean;
  requireBadgeName?: boolean;
  maxBadgeNameLength?: number;
  maxCriteriaLength?: number;
  allowEmptyBlockHeight?: boolean;
}

const DEFAULT_OPTIONS: BadgeEventValidationOptions = {
  requireBadgeId: false,
  requireBadgeName: false,
  maxBadgeNameLength: 255,
  maxCriteriaLength: 512,
  allowEmptyBlockHeight: false
};

function isValidStacksAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^(ST|SP)[A-Z0-9]{32}$/.test(address);
}

function isValidContractAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^(ST|SP)[A-Z0-9]{32}\.[a-z0-9\-]+$/.test(address);
}

function isValidTransactionHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') return false;
  return /^[a-f0-9]{64}$/.test(hash) || /^[a-z0-9]{32,}$/.test(hash);
}

function isValidBlockHeight(height: number): boolean {
  return typeof height === 'number' && height >= 0 && Number.isInteger(height);
}

function isValidTimestamp(timestamp: number): boolean {
  return typeof timestamp === 'number' && timestamp >= 0;
}

export function validateBadgeMintEvent(
  event: any,
  options: BadgeEventValidationOptions = {}
): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!event || typeof event !== 'object') {
    errors.push('Event must be a valid object');
    return { valid: false, errors, warnings };
  }

  if (!event.userId || typeof event.userId !== 'string') {
    errors.push('userId is required and must be a string');
  } else if (!isValidStacksAddress(event.userId)) {
    warnings.push(`userId "${event.userId}" does not appear to be a valid Stacks address`);
  }

  if (opts.requireBadgeId && (!event.badgeId || typeof event.badgeId !== 'string')) {
    errors.push('badgeId is required and must be a string');
  } else if (event.badgeId && typeof event.badgeId !== 'string') {
    errors.push('badgeId must be a string if provided');
  }

  if (opts.requireBadgeName && (!event.badgeName || typeof event.badgeName !== 'string')) {
    errors.push('badgeName is required and must be a string');
  } else if (event.badgeName && typeof event.badgeName !== 'string') {
    errors.push('badgeName must be a string if provided');
  }

  if (event.badgeName && event.badgeName.length > (opts.maxBadgeNameLength || 255)) {
    errors.push(`badgeName exceeds maximum length of ${opts.maxBadgeNameLength || 255} characters`);
  }

  if (event.criteria && typeof event.criteria !== 'string') {
    errors.push('criteria must be a string if provided');
  } else if (event.criteria && event.criteria.length > (opts.maxCriteriaLength || 512)) {
    errors.push(`criteria exceeds maximum length of ${opts.maxCriteriaLength || 512} characters`);
  }

  if (!event.contractAddress || typeof event.contractAddress !== 'string') {
    errors.push('contractAddress is required and must be a string');
  } else if (!isValidContractAddress(event.contractAddress)) {
    warnings.push(`contractAddress "${event.contractAddress}" does not appear to be a valid contract address`);
  }

  if (!event.transactionHash || typeof event.transactionHash !== 'string') {
    errors.push('transactionHash is required and must be a string');
  } else if (!isValidTransactionHash(event.transactionHash)) {
    warnings.push(`transactionHash "${event.transactionHash}" does not appear to be a valid format`);
  }

  if (typeof event.blockHeight !== 'number') {
    if (!opts.allowEmptyBlockHeight) {
      errors.push('blockHeight is required and must be a number');
    }
  } else if (!isValidBlockHeight(event.blockHeight)) {
    errors.push('blockHeight must be a non-negative integer');
  }

  if (typeof event.timestamp !== 'number') {
    errors.push('timestamp is required and must be a number');
  } else if (!isValidTimestamp(event.timestamp)) {
    errors.push('timestamp must be a non-negative number');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateBadgeMintEventBatch(
  events: any[],
  options: BadgeEventValidationOptions = {}
): { results: ValidationResult[]; allValid: boolean } {
  if (!Array.isArray(events)) {
    return {
      results: [
        {
          valid: false,
          errors: ['events must be an array'],
          warnings: []
        }
      ],
      allValid: false
    };
  }

  const results = events.map(event => validateBadgeMintEvent(event, options));
  const allValid = results.every(result => result.valid);

  return { results, allValid };
}

export function sanitizeBadgeMintEvent(event: any): BadgeMintEvent | null {
  const validation = validateBadgeMintEvent(event);

  if (!validation.valid) {
    return null;
  }

  return {
    userId: String(event.userId).trim(),
    badgeId: event.badgeId ? String(event.badgeId).trim() : '',
    badgeName: event.badgeName ? String(event.badgeName).trim() : 'Achievement Badge',
    criteria: event.criteria ? String(event.criteria).trim() : 'completing a task',
    contractAddress: String(event.contractAddress).trim(),
    transactionHash: String(event.transactionHash).trim(),
    blockHeight: Number(event.blockHeight) || 0,
    timestamp: Number(event.timestamp) || Date.now()
  };
}

export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.valid) {
    return 'Validation passed';
  }

  const errorMessages = result.errors.map(error => `- ${error}`).join('\n');
  let message = 'Validation failed with the following errors:\n' + errorMessages;

  if (result.warnings.length > 0) {
    const warningMessages = result.warnings.map(warning => `- ${warning}`).join('\n');
    message += '\n\nWarnings:\n' + warningMessages;
  }

  return message;
}

export function getEventSummary(event: BadgeMintEvent): string {
  return `Badge Mint Event: ${event.badgeName} (${event.badgeId}) -> ${event.userId.substring(0, 10)}... [Block: ${event.blockHeight}, TX: ${event.transactionHash.substring(0, 8)}...]`;
}

export function compareEvents(event1: BadgeMintEvent, event2: BadgeMintEvent): boolean {
  return (
    event1.userId === event2.userId &&
    event1.badgeId === event2.badgeId &&
    event1.contractAddress === event2.contractAddress &&
    event1.transactionHash === event2.transactionHash
  );
}

export function isEventRecent(event: BadgeMintEvent, withinMs: number = 3600000): boolean {
  const now = Date.now();
  return Math.abs(now - event.timestamp) <= withinMs;
}

export function isEventFromPastBlock(event: BadgeMintEvent, currentBlockHeight: number): boolean {
  return event.blockHeight < currentBlockHeight;
}
