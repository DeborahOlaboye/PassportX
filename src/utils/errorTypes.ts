export type WalletErrorCode =
  | 'WC_CONNECT_FAILED'
  | 'WC_SIGN_FAILED'
  | 'WC_TIMEOUT'
  | 'WC_UNKNOWN';

export class WalletError extends Error {
  code: WalletErrorCode;
  details?: any;

  constructor(code: WalletErrorCode, message?: string, details?: any) {
    super(message ?? code);
    this.name = 'WalletError';
    this.code = code;
    this.details = details;
  }
}

export default { WalletError };
