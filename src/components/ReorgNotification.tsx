import React, { useEffect, useState } from 'react'
import ReorgStateManager, { ReorgUIState } from '../services/ReorgStateManager'

interface ReorgNotificationProps {
  className?: string
}

const ReorgNotification: React.FC<ReorgNotificationProps> = ({ className = '' }) => {
  const [reorgState, setReorgState] = useState<ReorgUIState | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const reorgManager = ReorgStateManager.getInstance()

    // Subscribe to reorg state changes
    const unsubscribe = reorgManager.subscribe((state) => {
      setReorgState(state)

      // Show notification when reorg is in progress or recently completed
      if (state.isReorgInProgress || state.reorgHistory.length > 0) {
        setIsVisible(true)

        // Auto-hide after 10 seconds if not in progress
        if (!state.isReorgInProgress) {
          setTimeout(() => setIsVisible(false), 10000)
        }
      }
    })

    // Initial state
    setReorgState(reorgManager.getState())

    return unsubscribe
  }, [])

  if (!isVisible || !reorgState) {
    return null
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  const affectedCount = reorgState.affectedEntities.size
  const pendingUpdates = reorgState.pendingUpdates.length

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${className}`}>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              {reorgState.isReorgInProgress ? 'Blockchain Reorganization in Progress' : 'Blockchain Reorganization Completed'}
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                {reorgState.isReorgInProgress
                  ? 'The blockchain is being reorganized. Some data may be temporarily inconsistent.'
                  : 'The blockchain reorganization has been processed. Data has been updated.'
                }
              </p>
              {affectedCount > 0 && (
                <p className="mt-1">
                  <strong>{affectedCount}</strong> entities affected
                </p>
              )}
              {pendingUpdates > 0 && reorgState.isReorgInProgress && (
                <p className="mt-1">
                  <strong>{pendingUpdates}</strong> updates pending
                </p>
              )}
              {reorgState.lastReorgBlock > 0 && (
                <p className="mt-1">
                  Last reorg at block: <strong>{reorgState.lastReorgBlock}</strong>
                </p>
              )}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex text-yellow-400 hover:text-yellow-600 focus:outline-none focus:text-yellow-600"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        {reorgState.isReorgInProgress && (
          <div className="mt-3">
            <div className="flex items-center">
              <div className="flex-1 bg-yellow-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <span className="ml-2 text-xs text-yellow-600">Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReorgNotification