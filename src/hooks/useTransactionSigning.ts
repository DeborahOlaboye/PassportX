import { useTransactionSigning } from '@/contexts/TransactionSigningContext';
import { TransactionRequest } from '@/types/transaction-signing';

export function useSTXTransfer() {
  const { signTransaction, broadcastTransaction, estimateGas } = useTransactionSigning();

  const transferSTX = async (recipient: string, amount: string, memo?: string) => {
    const request: TransactionRequest = {
      type: 'stx-transfer',
      recipient,
      amount,
      memo,
    };

    const signedTx = await signTransaction(request);
    await broadcastTransaction(signedTx);
    return signedTx;
  };

  const estimateTransferGas = async (recipient: string, amount: string) => {
    const request: TransactionRequest = {
      type: 'stx-transfer',
      recipient,
      amount,
    };
    return estimateGas(request);
  };

  return {
    transferSTX,
    estimateTransferGas,
  };
}

export function useContractCall() {
  const { signTransaction, broadcastTransaction, estimateGas } = useTransactionSigning();

  const callContract = async (
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: any[] = []
  ) => {
    const request: TransactionRequest = {
      type: 'contract-call',
      contractAddress,
      contractName,
      functionName,
      functionArgs,
    };

    const signedTx = await signTransaction(request);
    await broadcastTransaction(signedTx);
    return signedTx;
  };

  const estimateContractGas = async (
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: any[] = []
  ) => {
    const request: TransactionRequest = {
      type: 'contract-call',
      contractAddress,
      contractName,
      functionName,
      functionArgs,
    };
    return estimateGas(request);
  };

  return {
    callContract,
    estimateContractGas,
  };
}