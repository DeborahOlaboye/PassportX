/**
 * Transaction mocking utilities and factories for contract testing
 * Provides realistic transaction simulation with various states and responses
 */

/**
 * Transaction response type definitions
 */
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'dropped'

export interface TransactionResponse {
  txId: string
  status: TransactionStatus
  blockHeight?: number
  blockTime?: number
  confirmed: boolean
  fee: number
  nonce: number
  sender: string
  postConditionMode?: 'allow' | 'deny'
  postConditions?: PostCondition[]
}

export interface PostCondition {
  type: 'STX' | 'FT' | 'NFT'
  principal: string
  condition: string
  amount?: number
  assetName?: string
  assetAddress?: string
}

/**
 * Mock transaction factory
 */
export class MockTransactionFactory {
  /**
   * Create a successful transaction response
   */
  static createSuccessfulTransaction(overrides: Partial<TransactionResponse> = {}): TransactionResponse {
    return {
      txId: `tx_success_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      status: 'success',
      blockHeight: 50000 + Math.floor(Math.random() * 1000),
      blockTime: Math.floor(Date.now() / 1000),
      confirmed: true,
      fee: 180,
      nonce: Math.floor(Math.random() * 100),
      sender: 'STTEST123456789TESTNETADDRESS123456',
      postConditionMode: 'allow',
      ...overrides
    }
  }

  /**
   * Create a pending transaction response
   */
  static createPendingTransaction(overrides: Partial<TransactionResponse> = {}): TransactionResponse {
    return {
      txId: `tx_pending_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      status: 'pending',
      confirmed: false,
      fee: 180,
      nonce: Math.floor(Math.random() * 100),
      sender: 'STTEST123456789TESTNETADDRESS123456',
      postConditionMode: 'allow',
      ...overrides
    }
  }

  /**
   * Create a failed transaction response
   */
  static createFailedTransaction(reason: string, overrides: Partial<TransactionResponse> = {}): TransactionResponse {
    return {
      txId: `tx_failed_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      status: 'failed',
      blockHeight: 50000 + Math.floor(Math.random() * 1000),
      blockTime: Math.floor(Date.now() / 1000),
      confirmed: true,
      fee: 180,
      nonce: Math.floor(Math.random() * 100),
      sender: 'STTEST123456789TESTNETADDRESS123456',
      postConditionMode: 'allow',
      ...overrides
    }
  }

  /**
   * Create a dropped transaction response
   */
  static createDroppedTransaction(overrides: Partial<TransactionResponse> = {}): TransactionResponse {
    return {
      txId: `tx_dropped_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      status: 'dropped',
      confirmed: false,
      fee: 180,
      nonce: Math.floor(Math.random() * 100),
      sender: 'STTEST123456789TESTNETADDRESS123456',
      postConditionMode: 'allow',
      ...overrides
    }
  }

  /**
   * Create transaction with STX post-condition
   */
  static createSTXPostCondition(
    principal: string,
    amount: number,
    condition: 'send-greater-than' | 'send-greater-than-or-equal' | 'send-less-than' | 'send-less-than-or-equal' | 'send-equal'
  ): PostCondition {
    return {
      type: 'STX',
      principal,
      condition,
      amount
    }
  }

  /**
   * Create transaction with fungible token post-condition
   */
  static createFTPostCondition(
    principal: string,
    assetAddress: string,
    assetName: string,
    amount: number,
    condition: string
  ): PostCondition {
    return {
      type: 'FT',
      principal,
      condition,
      amount,
      assetAddress,
      assetName
    }
  }

  /**
   * Create transaction with NFT post-condition
   */
  static createNFTPostCondition(
    principal: string,
    assetAddress: string,
    assetName: string,
    condition: string
  ): PostCondition {
    return {
      type: 'NFT',
      principal,
      condition,
      assetAddress,
      assetName
    }
  }
}

/**
 * Realistic transaction sequence simulator
 */
export class TransactionSequenceSimulator {
  private currentState: TransactionStatus = 'pending'
  private sequence: TransactionResponse[] = []
  private currentStep: number = 0

  /**
   * Create a sequence: pending -> success
   */
  static successSequence(): TransactionSequenceSimulator {
    const simulator = new TransactionSequenceSimulator()
    const txId = `tx_seq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    simulator.sequence = [
      {
        txId,
        status: 'pending',
        confirmed: false,
        fee: 180,
        nonce: 1,
        sender: 'STTEST123456789TESTNETADDRESS123456'
      },
      {
        txId,
        status: 'success',
        blockHeight: 50000,
        blockTime: Math.floor(Date.now() / 1000) + 10,
        confirmed: true,
        fee: 180,
        nonce: 1,
        sender: 'STTEST123456789TESTNETADDRESS123456'
      }
    ]
    return simulator
  }

  /**
   * Create a sequence: pending -> failed
   */
  static failureSequence(): TransactionSequenceSimulator {
    const simulator = new TransactionSequenceSimulator()
    const txId = `tx_seq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    simulator.sequence = [
      {
        txId,
        status: 'pending',
        confirmed: false,
        fee: 180,
        nonce: 1,
        sender: 'STTEST123456789TESTNETADDRESS123456'
      },
      {
        txId,
        status: 'failed',
        blockHeight: 50000,
        blockTime: Math.floor(Date.now() / 1000) + 10,
        confirmed: true,
        fee: 180,
        nonce: 1,
        sender: 'STTEST123456789TESTNETADDRESS123456'
      }
    ]
    return simulator
  }

  /**
   * Create a sequence: pending -> dropped
   */
  static droppedSequence(): TransactionSequenceSimulator {
    const simulator = new TransactionSequenceSimulator()
    const txId = `tx_seq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    simulator.sequence = [
      {
        txId,
        status: 'pending',
        confirmed: false,
        fee: 180,
        nonce: 1,
        sender: 'STTEST123456789TESTNETADDRESS123456'
      },
      {
        txId,
        status: 'dropped',
        confirmed: false,
        fee: 180,
        nonce: 1,
        sender: 'STTEST123456789TESTNETADDRESS123456'
      }
    ]
    return simulator
  }

  /**
   * Get next transaction in sequence
   */
  getNext(): TransactionResponse {
    if (this.currentStep >= this.sequence.length) {
      return this.sequence[this.sequence.length - 1]
    }
    const response = this.sequence[this.currentStep]
    this.currentStep++
    return response
  }

  /**
   * Reset to beginning of sequence
   */
  reset(): void {
    this.currentStep = 0
  }

  /**
   * Get all transactions in sequence
   */
  getSequence(): TransactionResponse[] {
    return [...this.sequence]
  }

  /**
   * Get current step
   */
  getCurrentStep(): number {
    return this.currentStep
  }
}

/**
 * Error simulation factory for transaction-related errors
 */
export class TransactionErrorFactory {
  /**
   * Insufficient balance error
   */
  static insufficientBalance(required: number, available: number): Error {
    return new Error(
      `Insufficient balance. Required: ${required} microSTX, Available: ${available} microSTX`
    )
  }

  /**
   * Post-condition failure error
   */
  static postConditionFailed(condition: string, details: string): Error {
    return new Error(`Post-condition failed: ${condition}. Details: ${details}`)
  }

  /**
   * Contract not found error
   */
  static contractNotFound(address: string, contractName: string): Error {
    return new Error(`Contract not found at ${address}.${contractName}`)
  }

  /**
   * Execution error
   */
  static executionError(details: string, errorCode?: string): Error {
    const message = `Execution error: ${details}${errorCode ? ` (Error code: ${errorCode})` : ''}`
    return new Error(message)
  }

  /**
   * Authorization error
   */
  static authorizationError(reason: string): Error {
    return new Error(`Authorization failed: ${reason}`)
  }

  /**
   * Invalid transaction error
   */
  static invalidTransaction(reason: string): Error {
    return new Error(`Invalid transaction: ${reason}`)
  }

  /**
   * Network error
   */
  static networkError(details: string): Error {
    return new Error(`Network error: ${details}`)
  }

  /**
   * Timeout error
   */
  static timeoutError(operation: string, duration: number): Error {
    return new Error(`Timeout waiting for ${operation} (${duration}ms)`)
  }

  /**
   * Serialization error
   */
  static serializationError(details: string): Error {
    return new Error(`Failed to serialize transaction: ${details}`)
  }

  /**
   * Signature error
   */
  static signatureError(details: string): Error {
    return new Error(`Signature error: ${details}`)
  }

  /**
   * Nonce error
   */
  static nonceError(expected: number, provided: number): Error {
    return new Error(`Invalid nonce. Expected: ${expected}, Provided: ${provided}`)
  }
}

/**
 * Post-condition validation simulator
 */
export class PostConditionValidator {
  /**
   * Validate STX post-condition
   */
  static validateSTX(
    condition: PostCondition,
    actualAmount: number
  ): { valid: boolean; reason?: string } {
    if (condition.type !== 'STX') {
      return { valid: false, reason: 'Not an STX post-condition' }
    }

    const required = condition.amount || 0

    switch (condition.condition) {
      case 'send-greater-than':
        return {
          valid: actualAmount > required,
          reason: actualAmount <= required ? `Amount ${actualAmount} not greater than ${required}` : undefined
        }
      case 'send-greater-than-or-equal':
        return {
          valid: actualAmount >= required,
          reason: actualAmount < required ? `Amount ${actualAmount} not >= ${required}` : undefined
        }
      case 'send-less-than':
        return {
          valid: actualAmount < required,
          reason: actualAmount >= required ? `Amount ${actualAmount} not less than ${required}` : undefined
        }
      case 'send-less-than-or-equal':
        return {
          valid: actualAmount <= required,
          reason: actualAmount > required ? `Amount ${actualAmount} not <= ${required}` : undefined
        }
      case 'send-equal':
        return {
          valid: actualAmount === required,
          reason: actualAmount !== required ? `Amount ${actualAmount} not equal to ${required}` : undefined
        }
      default:
        return { valid: false, reason: 'Unknown post-condition type' }
    }
  }

  /**
   * Validate fungible token post-condition
   */
  static validateFT(
    condition: PostCondition,
    actualAmount: number
  ): { valid: boolean; reason?: string } {
    if (condition.type !== 'FT') {
      return { valid: false, reason: 'Not an FT post-condition' }
    }

    return this.validateSTX(condition, actualAmount)
  }

  /**
   * Validate NFT post-condition
   */
  static validateNFT(condition: PostCondition): { valid: boolean; reason?: string } {
    if (condition.type !== 'NFT') {
      return { valid: false, reason: 'Not an NFT post-condition' }
    }

    // NFT validations typically check ownership, not amounts
    if (!condition.assetAddress || !condition.assetName) {
      return { valid: false, reason: 'Missing asset details' }
    }

    return { valid: true }
  }

  /**
   * Validate all post-conditions
   */
  static validateAll(conditions: PostCondition[], actualAmounts: Record<string, number>): {
    valid: boolean
    failures: Array<{ condition: PostCondition; reason: string }>
  } {
    const failures: Array<{ condition: PostCondition; reason: string }> = []

    for (const condition of conditions) {
      const key = `${condition.type}:${condition.assetName || ''}`
      const actualAmount = actualAmounts[key] || 0

      let validation

      if (condition.type === 'STX') {
        validation = this.validateSTX(condition, actualAmount)
      } else if (condition.type === 'FT') {
        validation = this.validateFT(condition, actualAmount)
      } else if (condition.type === 'NFT') {
        validation = this.validateNFT(condition)
      }

      if (validation && !validation.valid && validation.reason) {
        failures.push({ condition, reason: validation.reason })
      }
    }

    return {
      valid: failures.length === 0,
      failures
    }
  }
}

/**
 * Fee estimation simulator
 */
export class FeeEstimator {
  /**
   * Estimate base fee
   */
  static estimateBaseFee(): number {
    return 180 // 180 microSTX is standard base fee
  }

  /**
   * Estimate additional fee for complexity
   */
  static estimateComplexityFee(contractLength: number, argumentCount: number): number {
    const lengthFee = Math.ceil(contractLength / 100) * 10
    const argFee = argumentCount * 5
    return lengthFee + argFee
  }

  /**
   * Estimate total fee
   */
  static estimateTotalFee(
    contractLength: number,
    argumentCount: number,
    postConditionCount: number = 0
  ): number {
    const baseFee = this.estimateBaseFee()
    const complexityFee = this.estimateComplexityFee(contractLength, argumentCount)
    const postConditionFee = postConditionCount * 20

    return baseFee + complexityFee + postConditionFee
  }

  /**
   * Estimate fee with priority
   */
  static estimateFeeWithPriority(
    contractLength: number,
    argumentCount: number,
    priority: 'low' | 'medium' | 'high'
  ): number {
    const baseFee = this.estimateTotalFee(contractLength, argumentCount)

    switch (priority) {
      case 'low':
        return baseFee
      case 'medium':
        return Math.ceil(baseFee * 1.25)
      case 'high':
        return Math.ceil(baseFee * 1.5)
      default:
        return baseFee
    }
  }
}

/**
 * Nonce management simulator
 */
export class NonceManager {
  private nonces: Map<string, number> = new Map()

  /**
   * Get next nonce for principal
   */
  getNextNonce(principal: string): number {
    const current = this.nonces.get(principal) || 0
    const next = current + 1
    this.nonces.set(principal, next)
    return next
  }

  /**
   * Get current nonce
   */
  getCurrentNonce(principal: string): number {
    return this.nonces.get(principal) || 0
  }

  /**
   * Reset nonce for principal
   */
  resetNonce(principal: string): void {
    this.nonces.delete(principal)
  }

  /**
   * Reset all nonces
   */
  resetAll(): void {
    this.nonces.clear()
  }

  /**
   * Set nonce for principal
   */
  setNonce(principal: string, nonce: number): void {
    this.nonces.set(principal, nonce)
  }
}

export default {
  MockTransactionFactory,
  TransactionSequenceSimulator,
  TransactionErrorFactory,
  PostConditionValidator,
  FeeEstimator,
  NonceManager
}
