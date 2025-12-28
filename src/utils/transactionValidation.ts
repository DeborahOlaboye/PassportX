import { TransactionRequest } from '@/types/transaction-signing';

export class TransactionValidator {
  private static readonly STX_ADDRESS_REGEX = /^S[0-9A-Z]{39}$/;
  private static readonly PRINCIPAL_ADDRESS_REGEX = /^S[0-9A-Z]{39}$/;

  static validateSTXTransfer(request: TransactionRequest): ValidationResult {
    const errors: string[] = [];

    if (!request.recipient) {
      errors.push('Recipient address is required');
    } else if (!this.isValidAddress(request.recipient)) {
      errors.push('Invalid recipient address format');
    }

    if (!request.amount) {
      errors.push('Amount is required');
    } else {
      const amount = parseFloat(request.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
      }
      if (amount < 0.000001) {
        errors.push('Minimum amount is 0.000001 STX');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateContractCall(request: TransactionRequest): ValidationResult {
    const errors: string[] = [];

    if (!request.contractAddress) {
      errors.push('Contract address is required');
    } else if (!this.isValidAddress(request.contractAddress)) {
      errors.push('Invalid contract address format');
    }

    if (!request.contractName) {
      errors.push('Contract name is required');
    }

    if (!request.functionName) {
      errors.push('Function name is required');
    }

    // Validate function arguments based on function name
    if (request.functionArgs) {
      errors.push(...this.validateFunctionArgs(request.functionName, request.functionArgs));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static validateFunctionArgs(functionName: string, args: any[]): string[] {
    const errors: string[] = [];

    switch (functionName) {
      case 'mint-badge':
        if (args.length < 2) {
          errors.push('mint-badge requires badge ID and recipient address');
        } else {
          if (typeof args[0] !== 'string' || args[0].trim() === '') {
            errors.push('Badge ID must be a non-empty string');
          }
          if (!this.isValidAddress(args[1])) {
            errors.push('Invalid recipient address for mint-badge');
          }
        }
        break;

      case 'transfer-badge':
        if (args.length < 2) {
          errors.push('transfer-badge requires badge ID and recipient address');
        } else {
          if (typeof args[0] !== 'string' || args[0].trim() === '') {
            errors.push('Badge ID must be a non-empty string');
          }
          if (!this.isValidAddress(args[1])) {
            errors.push('Invalid recipient address for transfer-badge');
          }
        }
        break;

      case 'join-community':
        if (args.length < 2) {
          errors.push('join-community requires community ID and user address');
        } else {
          if (typeof args[0] !== 'string' || args[0].trim() === '') {
            errors.push('Community ID must be a non-empty string');
          }
          if (!this.isValidAddress(args[1])) {
            errors.push('Invalid user address for join-community');
          }
        }
        break;

      default:
        // Generic validation for unknown functions
        args.forEach((arg, index) => {
          if (arg === null || arg === undefined) {
            errors.push(`Argument ${index + 1} cannot be null or undefined`);
          }
        });
    }

    return errors;
  }

  static validateGasParameters(gasLimit?: string, gasPrice?: string): ValidationResult {
    const errors: string[] = [];

    if (gasLimit) {
      const limit = parseInt(gasLimit);
      if (isNaN(limit) || limit <= 0) {
        errors.push('Gas limit must be a positive integer');
      }
      if (limit > 10000000) {
        errors.push('Gas limit cannot exceed 10,000,000');
      }
    }

    if (gasPrice) {
      const price = parseInt(gasPrice);
      if (isNaN(price) || price <= 0) {
        errors.push('Gas price must be a positive integer');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static isValidAddress(address: string): boolean {
    return this.STX_ADDRESS_REGEX.test(address) || this.PRINCIPAL_ADDRESS_REGEX.test(address);
  }

  static sanitizeAmount(amount: string): string {
    const cleaned = amount.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  }

  static formatAmount(amount: string): string {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    return num.toFixed(6);
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}