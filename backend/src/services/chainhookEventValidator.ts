export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export class ChainhookEventValidator {
  private logger: any

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    }
  }

  validateBlockEvent(event: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check block identifier
    if (!event.block_identifier) {
      errors.push('Missing block_identifier')
    } else {
      if (!event.block_identifier.index || typeof event.block_identifier.index !== 'number') {
        errors.push('Invalid or missing block_identifier.index')
      }
      if (!event.block_identifier.hash || typeof event.block_identifier.hash !== 'string') {
        errors.push('Invalid or missing block_identifier.hash')
      }
    }

    // Check parent block identifier
    if (!event.parent_block_identifier) {
      errors.push('Missing parent_block_identifier')
    } else {
      if (!event.parent_block_identifier.index || typeof event.parent_block_identifier.index !== 'number') {
        errors.push('Invalid or missing parent_block_identifier.index')
      }
      if (!event.parent_block_identifier.hash || typeof event.parent_block_identifier.hash !== 'string') {
        errors.push('Invalid or missing parent_block_identifier.hash')
      }
    }

    // Check timestamp
    if (!event.timestamp || typeof event.timestamp !== 'number') {
      warnings.push('Missing or invalid timestamp')
    }

    // Check type
    if (!event.type || typeof event.type !== 'string') {
      errors.push('Missing or invalid event type')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  validateTransaction(transaction: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check transaction index
    if (typeof transaction.transaction_index !== 'number') {
      errors.push('Missing or invalid transaction_index')
    }

    // Check transaction hash
    if (!transaction.transaction_hash || typeof transaction.transaction_hash !== 'string') {
      errors.push('Missing or invalid transaction_hash')
    }

    // Check operations
    if (!Array.isArray(transaction.operations)) {
      warnings.push('Missing or invalid operations array')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  validateOperation(operation: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check operation type
    if (!operation.type || typeof operation.type !== 'string') {
      errors.push('Missing or invalid operation type')
    }

    // For contract calls, validate specific fields
    if (operation.type === 'contract_call') {
      if (!operation.contract_call) {
        errors.push('Missing contract_call for contract_call operation')
      } else {
        if (!operation.contract_call.contract) {
          errors.push('Missing contract address')
        }
        if (!operation.contract_call.method) {
          errors.push('Missing contract method')
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  validateCompleteEvent(event: any): ValidationResult {
    const allErrors: string[] = []
    const allWarnings: string[] = []

    // Validate block event
    const blockValidation = this.validateBlockEvent(event)
    allErrors.push(...blockValidation.errors)
    allWarnings.push(...blockValidation.warnings)

    // Validate transactions
    if (Array.isArray(event.transactions)) {
      for (let i = 0; i < event.transactions.length; i++) {
        const txValidation = this.validateTransaction(event.transactions[i])
        allErrors.push(...txValidation.errors.map(e => `Transaction ${i}: ${e}`))
        allWarnings.push(...txValidation.warnings.map(w => `Transaction ${i}: ${w}`))

        // Validate operations
        if (Array.isArray(event.transactions[i].operations)) {
          for (let j = 0; j < event.transactions[i].operations.length; j++) {
            const opValidation = this.validateOperation(event.transactions[i].operations[j])
            allErrors.push(...opValidation.errors.map(e => `Transaction ${i}, Operation ${j}: ${e}`))
            allWarnings.push(...opValidation.warnings.map(w => `Transaction ${i}, Operation ${j}: ${w}`))
          }
        }
      }
    }

    const result = {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }

    if (!result.valid) {
      this.logger.warn('Event validation failed', { errors: result.errors })
    }

    return result
  }

  validateEventSchema(event: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if event is an object
    if (!event || typeof event !== 'object') {
      errors.push('Event must be an object')
      return { valid: false, errors, warnings }
    }

    // Validate complete event
    return this.validateCompleteEvent(event)
  }

  canProcessEvent(event: any): boolean {
    const validation = this.validateEventSchema(event)
    return validation.valid
  }

  getValidationErrors(event: any): string[] {
    return this.validateEventSchema(event).errors
  }

  getValidationWarnings(event: any): string[] {
    return this.validateEventSchema(event).warnings
  }
}

export default ChainhookEventValidator
