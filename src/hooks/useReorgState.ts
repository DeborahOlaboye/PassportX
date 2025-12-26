import { useState, useEffect } from 'react'
import ReorgStateManager, { ReorgUIState } from '../services/ReorgStateManager'

/**
 * Hook for subscribing to reorg state changes
 */
export const useReorgState = () => {
  const [reorgState, setReorgState] = useState<ReorgUIState | null>(null)

  useEffect(() => {
    const reorgManager = ReorgStateManager.getInstance()

    // Subscribe to reorg state changes
    const unsubscribe = reorgManager.subscribe((state) => {
      setReorgState(state)
    })

    // Set initial state
    setReorgState(reorgManager.getState())

    // Cleanup subscription on unmount
    return unsubscribe
  }, [])

  return reorgState
}

/**
 * Hook for checking if a specific entity is affected by reorg
 */
export const useEntityReorgStatus = (entityId: string) => {
  const reorgState = useReorgState()

  return {
    isAffected: reorgState ? reorgState.affectedEntities.has(entityId) : false,
    pendingUpdates: reorgState ? reorgState.pendingUpdates.filter(update => update.entityId === entityId) : [],
    isReorgInProgress: reorgState ? reorgState.isReorgInProgress : false
  }
}

/**
 * Hook for reorg statistics
 */
export const useReorgStats = () => {
  const reorgState = useReorgState()

  if (!reorgState) {
    return {
      totalReorgs: 0,
      lastReorgBlock: 0,
      affectedEntitiesCount: 0,
      pendingUpdatesCount: 0
    }
  }

  return {
    totalReorgs: reorgState.reorgHistory.length,
    lastReorgBlock: reorgState.lastReorgBlock,
    affectedEntitiesCount: reorgState.affectedEntities.size,
    pendingUpdatesCount: reorgState.pendingUpdates.length
  }
}

export default useReorgState