export interface Subscription {
  id: string
  name: string
  eventType: string
  predicateConfig: any
  active: boolean
  createdAt: Date
  updatedAt: Date
  filters?: Record<string, any>
}

export interface EventListener {
  id: string
  subscriptionId: string
  handler: (event: any) => Promise<void>
  active: boolean
}

export class ChainhookSubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map()
  private listeners: Map<string, EventListener[]> = new Map()
  private subscriptionIdCounter = 0
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

  createSubscription(
    name: string,
    eventType: string,
    predicateConfig: any,
    filters?: Record<string, any>
  ): Subscription {
    const subscription: Subscription = {
      id: this.generateSubscriptionId(),
      name,
      eventType,
      predicateConfig,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      filters
    }

    this.subscriptions.set(subscription.id, subscription)
    this.logger.info(`Subscription created: ${subscription.id} (${name})`)

    return subscription
  }

  getSubscription(id: string): Subscription | undefined {
    return this.subscriptions.get(id)
  }

  getAllSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values())
  }

  getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.active)
  }

  getSubscriptionsByEventType(eventType: string): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.eventType === eventType && s.active)
  }

  updateSubscription(id: string, updates: Partial<Subscription>): Subscription | null {
    const subscription = this.subscriptions.get(id)

    if (!subscription) {
      this.logger.warn(`Subscription not found: ${id}`)
      return null
    }

    const updated: Subscription = {
      ...subscription,
      ...updates,
      id: subscription.id,
      createdAt: subscription.createdAt,
      updatedAt: new Date()
    }

    this.subscriptions.set(id, updated)
    this.logger.info(`Subscription updated: ${id}`)

    return updated
  }

  activateSubscription(id: string): boolean {
    const subscription = this.subscriptions.get(id)

    if (!subscription) {
      this.logger.warn(`Subscription not found: ${id}`)
      return false
    }

    subscription.active = true
    subscription.updatedAt = new Date()
    this.logger.info(`Subscription activated: ${id}`)

    return true
  }

  deactivateSubscription(id: string): boolean {
    const subscription = this.subscriptions.get(id)

    if (!subscription) {
      this.logger.warn(`Subscription not found: ${id}`)
      return false
    }

    subscription.active = false
    subscription.updatedAt = new Date()
    this.logger.info(`Subscription deactivated: ${id}`)

    return true
  }

  deleteSubscription(id: string): boolean {
    const deleted = this.subscriptions.delete(id)

    if (deleted) {
      this.listeners.delete(id)
      this.logger.info(`Subscription deleted: ${id}`)
    } else {
      this.logger.warn(`Subscription not found: ${id}`)
    }

    return deleted
  }

  registerListener(subscriptionId: string, handler: (event: any) => Promise<void>): EventListener {
    const subscription = this.subscriptions.get(subscriptionId)

    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`)
    }

    const listener: EventListener = {
      id: this.generateListenerId(),
      subscriptionId,
      handler,
      active: true
    }

    const subscriptionListeners = this.listeners.get(subscriptionId) || []
    subscriptionListeners.push(listener)
    this.listeners.set(subscriptionId, subscriptionListeners)

    this.logger.info(`Listener registered for subscription: ${subscriptionId}`)

    return listener
  }

  unregisterListener(subscriptionId: string, listenerId: string): boolean {
    const listeners = this.listeners.get(subscriptionId)

    if (!listeners) {
      return false
    }

    const index = listeners.findIndex(l => l.id === listenerId)

    if (index > -1) {
      listeners.splice(index, 1)
      this.logger.info(`Listener unregistered: ${listenerId}`)
      return true
    }

    return false
  }

  getListeners(subscriptionId: string): EventListener[] {
    return this.listeners.get(subscriptionId) || []
  }

  getActiveListeners(subscriptionId: string): EventListener[] {
    return (this.listeners.get(subscriptionId) || []).filter(l => l.active)
  }

  async dispatchEvent(subscriptionId: string, event: any): Promise<void> {
    const listeners = this.getActiveListeners(subscriptionId)

    if (listeners.length === 0) {
      this.logger.debug(`No active listeners for subscription: ${subscriptionId}`)
      return
    }

    const promises = listeners.map((listener) => {
      return listener.handler(event).catch((error) => {
        this.logger.error(`Error in listener ${listener.id}:`, error)
      })
    })

    await Promise.all(promises)
  }

  async dispatchEventToAll(event: any, eventType?: string): Promise<void> {
    const subscriptions = eventType
      ? this.getSubscriptionsByEventType(eventType)
      : this.getActiveSubscriptions()

    const promises = subscriptions.map((subscription) => this.dispatchEvent(subscription.id, event))

    await Promise.all(promises)
  }

  activateListener(subscriptionId: string, listenerId: string): boolean {
    const listeners = this.listeners.get(subscriptionId)

    if (!listeners) {
      return false
    }

    const listener = listeners.find(l => l.id === listenerId)

    if (listener) {
      listener.active = true
      return true
    }

    return false
  }

  deactivateListener(subscriptionId: string, listenerId: string): boolean {
    const listeners = this.listeners.get(subscriptionId)

    if (!listeners) {
      return false
    }

    const listener = listeners.find(l => l.id === listenerId)

    if (listener) {
      listener.active = false
      return true
    }

    return false
  }

  getStatistics() {
    const totalSubscriptions = this.subscriptions.size
    const activeSubscriptions = this.getActiveSubscriptions().length
    const totalListeners = Array.from(this.listeners.values()).reduce((sum, arr) => sum + arr.length, 0)
    const activeListeners = Array.from(this.listeners.values()).reduce(
      (sum, arr) => sum + arr.filter(l => l.active).length,
      0
    )

    return {
      totalSubscriptions,
      activeSubscriptions,
      inactiveSubscriptions: totalSubscriptions - activeSubscriptions,
      totalListeners,
      activeListeners,
      inactiveListeners: totalListeners - activeListeners
    }
  }

  clearAllSubscriptions(): void {
    this.subscriptions.clear()
    this.listeners.clear()
    this.logger.warn('All subscriptions cleared')
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${++this.subscriptionIdCounter}`
  }

  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export default ChainhookSubscriptionManager
