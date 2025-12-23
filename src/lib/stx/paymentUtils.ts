import {
  FungiblePostCondition,
  makeStandardSTXPostCondition,
  FungibleConditionCode,
  PostConditionMode
} from '@stacks/transactions';

interface PaymentAmount {
  stx: number;
  microStx: bigint;
}

interface TransactionFee {
  suggested: number;
  fast: number;
  slow: number;
}

const STX_TO_MICROSTX = 1_000_000;
const MIN_STX_AMOUNT = 1;
const MAX_STX_AMOUNT = 1_000_000;

export const stxUtils = {
  stxToMicroStx(stx: number): bigint {
    return BigInt(Math.floor(stx * STX_TO_MICROSTX));
  },

  microStxToStx(microStx: bigint): number {
    return Number(microStx) / STX_TO_MICROSTX;
  },

  parseAmount(amountStr: string): number {
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      throw new Error('Invalid STX amount');
    }
    if (amount < MIN_STX_AMOUNT) {
      throw new Error(`Minimum STX amount is ${MIN_STX_AMOUNT}`);
    }
    if (amount > MAX_STX_AMOUNT) {
      throw new Error(`Maximum STX amount is ${MAX_STX_AMOUNT}`);
    }
    return amount;
  },

  formatStx(stx: number, decimals: number = 2): string {
    return stx.toFixed(decimals);
  },

  validateStxAmount(amount: number): { valid: boolean; error?: string } {
    if (amount < MIN_STX_AMOUNT) {
      return {
        valid: false,
        error: `Amount must be at least ${MIN_STX_AMOUNT} STX`
      };
    }
    if (amount > MAX_STX_AMOUNT) {
      return {
        valid: false,
        error: `Amount cannot exceed ${MAX_STX_AMOUNT} STX`
      };
    }
    if (!Number.isInteger(amount) && amount % 1 !== 0) {
      return {
        valid: false,
        error: 'Amount must be a valid number'
      };
    }
    return { valid: true };
  }
};

export const createPaymentPostCondition = (
  senderAddress: string,
  stxAmount: number
): FungiblePostCondition => {
  const microStx = stxUtils.stxToMicroStx(stxAmount);

  return makeStandardSTXPostCondition(
    senderAddress,
    FungibleConditionCode.LessEqual,
    microStx
  );
};

export const calculateNetworkFees = (
  baseFeeRate: number = 100,
  transactionSize: number = 200
): TransactionFee => {
  const baseFee = baseFeeRate * transactionSize;
  const baseStx = stxUtils.microStxToStx(BigInt(baseFee));

  return {
    slow: Math.max(0.00001, baseStx * 0.8),
    suggested: baseStx,
    fast: baseStx * 1.5
  };
};

export const estimateTransactionCost = (
  paymentAmount: number,
  feeRate: number = 100,
  transactionSize: number = 200
): { payment: number; fee: number; total: number } => {
  const networkFee = (feeRate * transactionSize) / STX_TO_MICROSTX;

  return {
    payment: paymentAmount,
    fee: networkFee,
    total: paymentAmount + networkFee
  };
};

export const validateSufficientBalance = (
  balance: number,
  requiredAmount: number
): { sufficient: boolean; shortfall?: number } => {
  if (balance >= requiredAmount) {
    return { sufficient: true };
  }

  return {
    sufficient: false,
    shortfall: requiredAmount - balance
  };
};

export const createPaymentMetadata = (
  communityName: string,
  paymentAmount: number,
  txId?: string
) => {
  return {
    type: 'community_creation',
    purpose: `Community creation fee for "${communityName}"`,
    amount: paymentAmount,
    currency: 'STX',
    timestamp: new Date().toISOString(),
    txId: txId || null,
    status: 'pending'
  };
};

export const getExplorerUrl = (
  txId: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): string => {
  const baseUrl = network === 'mainnet'
    ? 'https://explorer.stacks.co'
    : 'https://explorer.hiro.so';

  return `${baseUrl}/txid/${txId}`;
};

export const parseTransactionError = (error: any): string => {
  if (error.message) {
    if (error.message.includes('DUST_AMOUNT')) {
      return 'Transaction amount is too small';
    }
    if (error.message.includes('InsufficientBalance')) {
      return 'Insufficient STX balance';
    }
    if (error.message.includes('InvalidAmount')) {
      return 'Invalid transaction amount';
    }
    if (error.message.includes('PostConditionFailed')) {
      return 'Post-condition failed: insufficient funds';
    }
    return error.message;
  }

  return 'An error occurred during the transaction';
};

export const trackPaymentEvent = (
  eventType: 'initiated' | 'pending' | 'confirmed' | 'failed',
  data: {
    communityName: string;
    amount: number;
    txId?: string;
    error?: string;
  }
) => {
  const event = {
    type: `community_payment_${eventType}`,
    timestamp: new Date().toISOString(),
    data
  };

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event.type, {
      communityName: data.communityName,
      amount: data.amount,
      txId: data.txId
    });
  }

  console.log('Payment event tracked:', event);
};
