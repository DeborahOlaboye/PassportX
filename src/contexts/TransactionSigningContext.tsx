'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { TransactionRequest, SignedTransaction, GasEstimate, TransactionSigningState } from '@/types/transaction-signing';
import { useWalletConnect } from '@/contexts/WalletConnectContext';

const TransactionSigningContext = createContext<TransactionSigningState | undefined>(undefined);

export function TransactionSigningProvider({ children }: { children: React.ReactNode }) {
  const [currentRequest, setCurrentRequest] = useState<TransactionRequest | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signedTransactions, setSignedTransactions] = useState<SignedTransaction[]>([]);
  const { signTransaction: walletSign, broadcastTransaction: walletBroadcast } = useWalletConnect();

  const signTransaction = useCallback(async (request: TransactionRequest): Promise<SignedTransaction> => {
    setIsSigning(true);
    setCurrentRequest(request);

    try {
      const signedTx = await walletSign(request);
      const signedTransaction: SignedTransaction = {
        id: `${Date.now()}-${Math.random()}`,
        request,
        signedTx,
        timestamp: Date.now(),
        status: 'signed',
      };

      setSignedTransactions(prev => [signedTransaction, ...prev]);
      return signedTransaction;
    } catch (error) {
      const signedTransaction: SignedTransaction = {
        id: `${Date.now()}-${Math.random()}`,
        request,
        signedTx: null,
        timestamp: Date.now(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      setSignedTransactions(prev => [signedTransaction, ...prev]);
      throw error;
    } finally {
      setIsSigning(false);
      setCurrentRequest(null);
    }
  }, [walletSign]);

  const broadcastTransaction = useCallback(async (signedTx: SignedTransaction) => {
    try {
      const hash = await walletBroadcast(signedTx.signedTx);
      setSignedTransactions(prev =>
        prev.map(tx =>
          tx.id === signedTx.id
            ? { ...tx, status: 'broadcasting' as const, hash }
            : tx
        )
      );
    } catch (error) {
      setSignedTransactions(prev =>
        prev.map(tx =>
          tx.id === signedTx.id
            ? { ...tx, status: 'failed' as const, error: error instanceof Error ? error.message : 'Broadcast failed' }
            : tx
        )
      );
      throw error;
    }
  }, [walletBroadcast]);

  const estimateGas = useCallback(async (request: TransactionRequest): Promise<GasEstimate> => {
    // Mock gas estimation - in real implementation, this would call the blockchain
    const baseFee = '21000';
    const priorityFee = request.type === 'contract-call' ? '50000' : '10000';
    const total = (parseInt(baseFee) + parseInt(priorityFee)).toString();

    return {
      fee: total,
      total,
      breakdown: {
        base: baseFee,
        priority: priorityFee,
      },
    };
  }, []);

  return (
    <TransactionSigningContext.Provider value={{
      currentRequest,
      isSigning,
      signedTransactions,
      signTransaction,
      broadcastTransaction,
      estimateGas,
    }}>
      {children}
    </TransactionSigningContext.Provider>
  );
}

export function useTransactionSigning() {
  const context = useContext(TransactionSigningContext);
  if (context === undefined) {
    throw new Error('useTransactionSigning must be used within a TransactionSigningProvider');
  }
  return context;
}