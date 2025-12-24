'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Transaction, TransactionHistoryState } from '@/types/transaction';

type TransactionAction =
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id' | 'timestamp'> }
  | { type: 'UPDATE_TRANSACTION_STATUS'; payload: { hash: string; status: Transaction['status']; details?: Partial<Transaction> } }
  | { type: 'CLEAR_HISTORY' };

const transactionReducer = (state: Transaction[], action: TransactionAction): Transaction[] => {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return [{
        ...action.payload,
        id: `${action.payload.hash}-${Date.now()}`,
        timestamp: Date.now(),
      }, ...state];
    case 'UPDATE_TRANSACTION_STATUS':
      return state.map(tx =>
        tx.hash === action.payload.hash
          ? { ...tx, ...action.payload.details, status: action.payload.status }
          : tx
      );
    case 'CLEAR_HISTORY':
      return [];
    default:
      return state;
  }
};

const TransactionContext = createContext<TransactionHistoryState | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, dispatch] = useReducer(transactionReducer, []);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('transactionHistory');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.forEach((tx: Transaction) => {
          dispatch({ type: 'ADD_TRANSACTION', payload: tx });
        });
      } catch (error) {
        console.error('Failed to load transaction history:', error);
      }
    }
  }, []);

  // Save to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem('transactionHistory', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
  };

  const updateTransactionStatus = (hash: string, status: Transaction['status'], details?: Partial<Transaction>) => {
    dispatch({ type: 'UPDATE_TRANSACTION_STATUS', payload: { hash, status, details } });
  };

  const clearHistory = () => {
    dispatch({ type: 'CLEAR_HISTORY' });
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransaction,
      updateTransactionStatus,
      clearHistory,
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactionHistory() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactionHistory must be used within a TransactionProvider');
  }
  return context;
}