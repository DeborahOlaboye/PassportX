import { ReorgEvent } from '../../backend/src/services/ReorgHandlerService'

export interface UIStateUpdate {
  type: 'badge_removed' | 'badge_updated' | 'community_removed' | 'notification_removed'
  entityId: string
  previousState?: any
  timestamp: number
}

export interface ReorgUIState {
  isReorgInProgress: boolean
  lastReorgBlock: number
  affectedEntities: Set<string>
  pendingUpdates: UIStateUpdate[]
  reorgHistory: ReorgEvent[]
}

export class ReorgStateManager {
  private static instance: ReorgStateManager
  private state: ReorgUIState
  private listeners: Set<(state: ReorgUIState) => void> = new Set()
  private logger: any

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger()
    this.state = {
      isReorgInProgress: false,
      lastReorgBlock: 0,
      affectedEntities: new Set(),
      pendingUpdates: [],
      reorgHistory: []
    }
  }

  static getInstance(logger?: any): ReorgStateManager {
    if (!ReorgStateManager.instance) {
      ReorgStateManager.instance = new ReorgStateManager(logger)
    }
    return ReorgStateManager.instance
  }

  /**
   * Handle incoming reorg event from WebSocket or API
   */
  async handleReorgEvent(reorgEvent: ReorgEvent): Promise<void> {
    this.logger.info('Handling reorg event in UI state manager', {
      rollbackToBlock: reorgEvent.rollbackToBlock,
      affectedTransactions: reorgEvent.affectedTransactions.length
    })

    // Set reorg in progress
    this.updateState({
      ...this.state,
      isReorgInProgress: true,
      lastReorgBlock: reorgEvent.rollbackToBlock
    })

    try {
      // Identify affected entities from the reorg
      const affectedEntities = await this.identifyAffectedEntities(reorgEvent)

      // Generate UI state updates
      const updates = await this.generateUIUpdates(reorgEvent, affectedEntities)

      // Apply updates to state
      this.updateState({
        ...this.state,
        affectedEntities: new Set([...this.state.affectedEntities, ...affectedEntities]),
        pendingUpdates: [...this.state.pendingUpdates, ...updates],
        reorgHistory: [...this.state.reorgHistory, reorgEvent]
      })

      // Notify listeners
      this.notifyListeners()

      // Process pending updates
      await this.processPendingUpdates()

      this.logger.info('Reorg handling completed in UI state manager', {
        affectedEntitiesCount: affectedEntities.length,
        updatesCount: updates.length
      })

    } catch (error) {
      this.logger.error('Error handling reorg in UI state manager', error)
    } finally {
      // Clear reorg in progress flag
      this.updateState({
        ...this.state,
        isReorgInProgress: false
      })
      this.notifyListeners()
    }
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: ReorgUIState) => void): () => void {
    this.listeners.add(listener)
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Get current state
   */
  getState(): ReorgUIState {
    return { ...this.state }
  }

  /**
   * Check if an entity is affected by current reorg
   */
  isEntityAffected(entityId: string): boolean {
    return this.state.affectedEntities.has(entityId)
  }

  /**
   * Get pending updates for a specific entity
   */
  getPendingUpdatesForEntity(entityId: string): UIStateUpdate[] {
    return this.state.pendingUpdates.filter(update => update.entityId === entityId)
  }

  /**
   * Clear processed updates
   */
  clearProcessedUpdates(entityIds: string[]): void {
    this.updateState({
      ...this.state,
      pendingUpdates: this.state.pendingUpdates.filter(
        update => !entityIds.includes(update.entityId)
      )
    })
    this.notifyListeners()
  }

  /**
   * Identify entities affected by the reorg
   */
  private async identifyAffectedEntities(reorgEvent: ReorgEvent): Promise<string[]> {
    const affectedEntities: string[] = []

    try {
      // Query the API for entities affected by the reorg
      const response = await fetch(`/api/reorg/affected-entities?block=${reorgEvent.rollbackToBlock}`)
      if (response.ok) {
        const data = await response.json()
        affectedEntities.push(...data.entityIds)
      }

      // Also check affected transactions for direct entity identification
      for (const txHash of reorgEvent.affectedTransactions) {
        // Try to identify entities from transaction hash
        const entityId = await this.identifyEntityFromTransaction(txHash)
        if (entityId) {
          affectedEntities.push(entityId)
        }
      }

      // Remove duplicates
      return [...new Set(affectedEntities)]
    } catch (error) {
      this.logger.error('Error identifying affected entities', error)
      return []
    }
  }

  /**
   * Generate UI state updates based on reorg
   */
  private async generateUIUpdates(reorgEvent: ReorgEvent, affectedEntities: string[]): Promise<UIStateUpdate[]> {
    const updates: UIStateUpdate[] = []

    for (const entityId of affectedEntities) {
      try {
        // Fetch previous state before reorg
        const previousState = await this.fetchEntityPreviousState(entityId, reorgEvent.rollbackToBlock)

        if (previousState) {
          updates.push({
            type: this.determineUpdateType(entityId),
            entityId,
            previousState,
            timestamp: Date.now()
          })
        } else {
          // Entity was created after the rollback block, should be removed
          updates.push({
            type: this.determineRemovalType(entityId),
            entityId,
            timestamp: Date.now()
          })
        }
      } catch (error) {
        this.logger.error(`Error generating update for entity ${entityId}`, error)
      }
    }

    return updates
  }

  /**
   * Process pending UI updates
   */
  private async processPendingUpdates(): Promise<void> {
    const processedEntityIds: string[] = []

    for (const update of this.state.pendingUpdates) {
      try {
        await this.applyUIUpdate(update)
        processedEntityIds.push(update.entityId)
      } catch (error) {
        this.logger.error(`Error applying UI update for ${update.entityId}`, error)
      }
    }

    // Clear processed updates
    if (processedEntityIds.length > 0) {
      this.clearProcessedUpdates(processedEntityIds)
    }
  }

  /**
   * Apply a UI state update
   */
  private async applyUIUpdate(update: UIStateUpdate): Promise<void> {
    // This would trigger UI updates through React context or global state management
    // For now, we'll emit events that components can listen to

    const event = new CustomEvent('reorg-ui-update', {
      detail: update
    })

    window.dispatchEvent(event)

    this.logger.debug('Applied UI update', update)
  }

  /**
   * Identify entity from transaction hash
   */
  private async identifyEntityFromTransaction(txHash: string): Promise<string | null> {
    try {
      // Query API to get entity ID from transaction hash
      const response = await fetch(`/api/transactions/${txHash}/entity`)
      if (response.ok) {
        const data = await response.json()
        return data.entityId
      }
    } catch (error) {
      this.logger.error('Error identifying entity from transaction', error)
    }
    return null
  }

  /**
   * Fetch previous state of an entity before reorg
   */
  private async fetchEntityPreviousState(entityId: string, rollbackBlock: number): Promise<any> {
    try {
      const response = await fetch(`/api/entities/${entityId}/state?block=${rollbackBlock}`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      this.logger.error('Error fetching entity previous state', error)
    }
    return null
  }

  /**
   * Determine the type of update based on entity ID
   */
  private determineUpdateType(entityId: string): UIStateUpdate['type'] {
    if (entityId.startsWith('badge-')) {
      return 'badge_updated'
    } else if (entityId.startsWith('community-')) {
      return 'community_removed'
    } else if (entityId.startsWith('notification-')) {
      return 'notification_removed'
    }
    return 'badge_updated' // default
  }

  /**
   * Determine the type of removal based on entity ID
   */
  private determineRemovalType(entityId: string): UIStateUpdate['type'] {
    if (entityId.startsWith('badge-')) {
      return 'badge_removed'
    } else if (entityId.startsWith('community-')) {
      return 'community_removed'
    } else if (entityId.startsWith('notification-')) {
      return 'notification_removed'
    }
    return 'badge_removed' // default
  }

  /**
   * Update internal state and notify listeners
   */
  private updateState(newState: ReorgUIState): void {
    this.state = newState
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState())
      } catch (error) {
        this.logger.error('Error notifying listener', error)
      }
    })
  }

  /**
   * Get statistics about reorg handling
   */
  getReorgStats(): {
    totalReorgs: number
    lastReorgBlock: number
    affectedEntitiesCount: number
    pendingUpdatesCount: number
  } {
    return {
      totalReorgs: this.state.reorgHistory.length,
      lastReorgBlock: this.state.lastReorgBlock,
      affectedEntitiesCount: this.state.affectedEntities.size,
      pendingUpdatesCount: this.state.pendingUpdates.length
    }
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[ReorgStateManager] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[ReorgStateManager] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[ReorgStateManager] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ReorgStateManager] ${msg}`, ...args)
    }
  }
}

export default ReorgStateManager