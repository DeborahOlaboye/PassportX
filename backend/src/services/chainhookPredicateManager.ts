export interface Predicate {
  uuid: string
  name: string
  type: 'stacks-contract-call' | 'stacks-block' | 'stacks-print'
  network: 'mainnet' | 'testnet' | 'devnet'
  if_this: {
    scope: string
    [key: string]: any
  }
  then_that: {
    http_post?: {
      url: string
      authorization_header?: string
    }
    [key: string]: any
  }
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export class ChainhookPredicateManager {
  private predicates: Map<string, Predicate> = new Map()
  private predicateIdCounter = 0
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

  createPredicate(
    name: string,
    type: 'stacks-contract-call' | 'stacks-block' | 'stacks-print',
    network: 'mainnet' | 'testnet' | 'devnet',
    if_this: any,
    then_that: any
  ): Predicate {
    const predicate: Predicate = {
      uuid: this.generatePredicateUUID(),
      name,
      type,
      network,
      if_this,
      then_that,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.validatePredicate(predicate)
    this.predicates.set(predicate.uuid, predicate)

    this.logger.info(`Predicate created: ${predicate.uuid} (${name})`)

    return predicate
  }

  getPredicate(uuid: string): Predicate | undefined {
    return this.predicates.get(uuid)
  }

  getAllPredicates(): Predicate[] {
    return Array.from(this.predicates.values())
  }

  getActivePredicates(): Predicate[] {
    return Array.from(this.predicates.values()).filter(p => p.active)
  }

  getPredicatesByNetwork(network: string): Predicate[] {
    return Array.from(this.predicates.values()).filter(p => p.network === network)
  }

  getPredicatesByType(type: string): Predicate[] {
    return Array.from(this.predicates.values()).filter(p => p.type === type)
  }

  getPredicatesByName(name: string): Predicate[] {
    return Array.from(this.predicates.values()).filter(p => p.name === name)
  }

  updatePredicate(uuid: string, updates: Partial<Predicate>): Predicate | null {
    const predicate = this.predicates.get(uuid)

    if (!predicate) {
      this.logger.warn(`Predicate not found: ${uuid}`)
      return null
    }

    const updated: Predicate = {
      ...predicate,
      ...updates,
      uuid: predicate.uuid,
      createdAt: predicate.createdAt,
      updatedAt: new Date()
    }

    this.validatePredicate(updated)
    this.predicates.set(uuid, updated)

    this.logger.info(`Predicate updated: ${uuid}`)

    return updated
  }

  activatePredicate(uuid: string): boolean {
    const predicate = this.predicates.get(uuid)

    if (!predicate) {
      this.logger.warn(`Predicate not found: ${uuid}`)
      return false
    }

    predicate.active = true
    predicate.updatedAt = new Date()
    this.logger.info(`Predicate activated: ${uuid}`)

    return true
  }

  deactivatePredicate(uuid: string): boolean {
    const predicate = this.predicates.get(uuid)

    if (!predicate) {
      this.logger.warn(`Predicate not found: ${uuid}`)
      return false
    }

    predicate.active = false
    predicate.updatedAt = new Date()
    this.logger.info(`Predicate deactivated: ${uuid}`)

    return true
  }

  deletePredicate(uuid: string): boolean {
    const deleted = this.predicates.delete(uuid)

    if (deleted) {
      this.logger.info(`Predicate deleted: ${uuid}`)
    } else {
      this.logger.warn(`Predicate not found: ${uuid}`)
    }

    return deleted
  }

  private validatePredicate(predicate: Predicate): void {
    if (!predicate.uuid || predicate.uuid.length === 0) {
      throw new Error('Predicate UUID is required')
    }

    if (!predicate.name || predicate.name.length === 0) {
      throw new Error('Predicate name is required')
    }

    if (!['stacks-contract-call', 'stacks-block', 'stacks-print'].includes(predicate.type)) {
      throw new Error(`Invalid predicate type: ${predicate.type}`)
    }

    if (!['mainnet', 'testnet', 'devnet'].includes(predicate.network)) {
      throw new Error(`Invalid network: ${predicate.network}`)
    }

    if (!predicate.if_this || typeof predicate.if_this !== 'object') {
      throw new Error('Invalid if_this configuration')
    }

    if (!predicate.then_that || typeof predicate.then_that !== 'object') {
      throw new Error('Invalid then_that configuration')
    }
  }

  getPredicateConfig(uuid: string): Partial<Predicate> | null {
    const predicate = this.predicates.get(uuid)

    if (!predicate) {
      return null
    }

    return {
      uuid: predicate.uuid,
      name: predicate.name,
      type: predicate.type,
      network: predicate.network,
      if_this: predicate.if_this,
      then_that: predicate.then_that
    }
  }

  getStatistics() {
    const total = this.predicates.size
    const active = this.getActivePredicates().length
    const byNetwork: Record<string, number> = {
      mainnet: 0,
      testnet: 0,
      devnet: 0
    }
    const byType: Record<string, number> = {
      'stacks-contract-call': 0,
      'stacks-block': 0,
      'stacks-print': 0
    }

    for (const predicate of this.predicates.values()) {
      byNetwork[predicate.network]++
      byType[predicate.type]++
    }

    return {
      total,
      active,
      inactive: total - active,
      byNetwork,
      byType
    }
  }

  exportPredicates(): string {
    return JSON.stringify(Array.from(this.predicates.values()), null, 2)
  }

  importPredicates(json: string): number {
    try {
      const predicates = JSON.parse(json) as Predicate[]

      let imported = 0

      for (const predicate of predicates) {
        try {
          this.validatePredicate(predicate)
          this.predicates.set(predicate.uuid, {
            ...predicate,
            createdAt: new Date(predicate.createdAt),
            updatedAt: new Date(predicate.updatedAt)
          })
          imported++
        } catch (error) {
          this.logger.warn(`Failed to import predicate: ${predicate.uuid}`, error)
        }
      }

      this.logger.info(`Imported ${imported} predicates`)

      return imported
    } catch (error) {
      this.logger.error('Failed to import predicates:', error)
      throw error
    }
  }

  clearAllPredicates(): void {
    this.predicates.clear()
    this.logger.warn('All predicates cleared')
  }

  private generatePredicateUUID(): string {
    return `pred_${Date.now()}_${++this.predicateIdCounter}`
  }
}

export default ChainhookPredicateManager
