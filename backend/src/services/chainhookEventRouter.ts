export interface EventFilter {
  eventType?: string
  contractAddress?: string
  method?: string
  blockHeightMin?: number
  blockHeightMax?: number
  transactionHash?: string
}

export interface RoutingRule {
  id: string
  name: string
  filter: EventFilter
  handlers: Array<(event: any) => Promise<void>>
  enabled: boolean
}

export class ChainhookEventRouter {
  private routingRules: Map<string, RoutingRule> = new Map()
  private ruleIdCounter = 0
  private logger: any
  private eventLog: Array<{ ruleId: string; eventId: string; timestamp: Date }> = []
  private maxEventLogSize = 10000

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

  createRoutingRule(name: string, filter: EventFilter): RoutingRule {
    const rule: RoutingRule = {
      id: this.generateRuleId(),
      name,
      filter,
      handlers: [],
      enabled: true
    }

    this.routingRules.set(rule.id, rule)
    this.logger.info(`Routing rule created: ${rule.id} (${name})`)

    return rule
  }

  getRoutingRule(id: string): RoutingRule | undefined {
    return this.routingRules.get(id)
  }

  getAllRoutingRules(): RoutingRule[] {
    return Array.from(this.routingRules.values())
  }

  getActiveRoutingRules(): RoutingRule[] {
    return Array.from(this.routingRules.values()).filter(r => r.enabled)
  }

  addHandler(ruleId: string, handler: (event: any) => Promise<void>): boolean {
    const rule = this.routingRules.get(ruleId)

    if (!rule) {
      this.logger.warn(`Routing rule not found: ${ruleId}`)
      return false
    }

    rule.handlers.push(handler)
    return true
  }

  removeHandler(ruleId: string, index: number): boolean {
    const rule = this.routingRules.get(ruleId)

    if (!rule) {
      return false
    }

    if (index < 0 || index >= rule.handlers.length) {
      return false
    }

    rule.handlers.splice(index, 1)
    return true
  }

  enableRule(ruleId: string): boolean {
    const rule = this.routingRules.get(ruleId)

    if (!rule) {
      return false
    }

    rule.enabled = true
    return true
  }

  disableRule(ruleId: string): boolean {
    const rule = this.routingRules.get(ruleId)

    if (!rule) {
      return false
    }

    rule.enabled = false
    return true
  }

  deleteRoutingRule(ruleId: string): boolean {
    const deleted = this.routingRules.delete(ruleId)

    if (deleted) {
      this.logger.info(`Routing rule deleted: ${ruleId}`)
    }

    return deleted
  }

  async routeEvent(event: any): Promise<void> {
    const applicableRules = this.getApplicableRules(event)

    for (const rule of applicableRules) {
      try {
        for (const handler of rule.handlers) {
          await handler(event)
        }

        this.logEventRoute(rule.id, event.id || `evt_${Date.now()}`)
      } catch (error) {
        this.logger.error(`Error executing handler for rule ${rule.id}:`, error as Error)
      }
    }
  }

  private getApplicableRules(event: any): RoutingRule[] {
    return this.getActiveRoutingRules().filter(rule => this.matchesFilter(event, rule.filter))
  }

  private matchesFilter(event: any, filter: EventFilter): boolean {
    if (filter.eventType && event.eventType !== filter.eventType) {
      return false
    }

    if (filter.contractAddress && event.contractAddress !== filter.contractAddress) {
      return false
    }

    if (filter.method && event.method !== filter.method) {
      return false
    }

    if (filter.blockHeightMin && event.blockHeight < filter.blockHeightMin) {
      return false
    }

    if (filter.blockHeightMax && event.blockHeight > filter.blockHeightMax) {
      return false
    }

    if (filter.transactionHash && event.transactionHash !== filter.transactionHash) {
      return false
    }

    return true
  }

  private logEventRoute(ruleId: string, eventId: string): void {
    this.eventLog.push({
      ruleId,
      eventId,
      timestamp: new Date()
    })

    if (this.eventLog.length > this.maxEventLogSize) {
      this.eventLog.shift()
    }
  }

  getEventRoutingHistory(ruleId?: string, limit: number = 100): Array<{ ruleId: string; eventId: string; timestamp: Date }> {
    let history = this.eventLog

    if (ruleId) {
      history = history.filter(log => log.ruleId === ruleId)
    }

    return history.slice(-limit)
  }

  getRuleStatistics() {
    const totalRules = this.routingRules.size
    const enabledRules = this.getActiveRoutingRules().length
    const totalHandlers = Array.from(this.routingRules.values()).reduce((sum, rule) => sum + rule.handlers.length, 0)
    const totalRouteEvents = this.eventLog.length

    const routesByRule: Record<string, number> = {}

    for (const log of this.eventLog) {
      routesByRule[log.ruleId] = (routesByRule[log.ruleId] || 0) + 1
    }

    return {
      totalRules,
      enabledRules,
      disabledRules: totalRules - enabledRules,
      totalHandlers,
      totalRouteEvents,
      routesByRule
    }
  }

  clearEventRoutingHistory(): void {
    this.eventLog = []
    this.logger.warn('Event routing history cleared')
  }

  clearOldRoutingHistory(olderThanMinutes: number): number {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000)
    const initialLength = this.eventLog.length

    this.eventLog = this.eventLog.filter(log => log.timestamp > cutoffTime)

    const deletedCount = initialLength - this.eventLog.length

    if (deletedCount > 0) {
      this.logger.info(`Cleared ${deletedCount} old routing history entries`)
    }

    return deletedCount
  }

  private generateRuleId(): string {
    return `rule_${Date.now()}_${++this.ruleIdCounter}`
  }
}

export default ChainhookEventRouter
