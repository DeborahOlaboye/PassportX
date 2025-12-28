export interface Transaction {
  id: string;
  hash: `0x${string}`;
  method: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  gasUsed?: string;
  gasPrice?: string;
  value?: string;
  to?: string;
  from?: string;
  blockNumber?: number;
  confirmations?: number;
}

export interface TransactionHistoryState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateTransactionStatus: (hash: string, status: Transaction['status'], details?: Partial<Transaction>) => void;
  clearHistory: () => void;
}