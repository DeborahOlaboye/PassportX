import { TransactionRequest, GasEstimate } from '@/types/transaction-signing';

export class GasEstimator {
  private static readonly BASE_FEES = {
    'stx-transfer': 21000,
    'contract-call': 50000,
  };

  private static readonly PRIORITY_FEES = {
    low: 10000,
    medium: 20000,
    high: 50000,
  };

  static async estimateGas(request: TransactionRequest, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<GasEstimate> {
    const baseFee = this.BASE_FEES[request.type] || this.BASE_FEES['contract-call'];
    const priorityFee = this.PRIORITY_FEES[priority];
    const total = baseFee + priorityFee;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      fee: total.toString(),
      total: total.toString(),
      breakdown: {
        base: baseFee.toString(),
        priority: priorityFee.toString(),
      },
    };
  }

  static async getCurrentGasPrice(): Promise<{ slow: string; standard: string; fast: string }> {
    // Mock gas price data - in real implementation, this would fetch from blockchain
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      slow: '10000',
      standard: '20000',
      fast: '50000',
    };
  }

  static calculateMaxFee(gasLimit: string, gasPrice: string): string {
    return (parseInt(gasLimit) * parseInt(gasPrice)).toString();
  }

  static validateGasEstimate(estimate: GasEstimate): boolean {
    const total = parseInt(estimate.total);
    const base = parseInt(estimate.breakdown.base);
    const priority = parseInt(estimate.breakdown.priority);

    return total === base + priority && total > 0;
  }
}

export function formatGasFee(fee: string, decimals: number = 6): string {
  const microSTX = parseInt(fee);
  const STX = microSTX / 1_000_000;
  return STX.toFixed(decimals);
}

export function parseGasFee(fee: string): number {
  return parseFloat(fee) * 1_000_000; // Convert STX to microSTX
}