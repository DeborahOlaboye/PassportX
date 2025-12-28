export interface TransactionRequest {
  type: 'stx-transfer' | 'contract-call';
  recipient?: string;
  amount?: string;
  contractAddress?: string;
  contractName?: string;
  functionName?: string;
  functionArgs?: any[];
  memo?: string;
}

export interface SignedTransaction {
  id: string;
  request: TransactionRequest;
  signedTx: any;
  timestamp: number;
  status: 'signed' | 'broadcasting' | 'confirmed' | 'failed';
  hash?: string;
  error?: string;
}

export interface GasEstimate {
  fee: string;
  total: string;
  breakdown: {
    base: string;
    priority: string;
  };
}

export interface TransactionSigningState {
  currentRequest: TransactionRequest | null;
  isSigning: boolean;
  signedTransactions: SignedTransaction[];
  signTransaction: (request: TransactionRequest) => Promise<SignedTransaction>;
  broadcastTransaction: (signedTx: SignedTransaction) => Promise<void>;
  estimateGas: (request: TransactionRequest) => Promise<GasEstimate>;
}