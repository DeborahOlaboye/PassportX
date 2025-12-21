import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

export interface AnalyticsUpdate {
  timestamp: number
  eventType: string
  data: Record<string, any>
}

export function useAnalyticsUpdates() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [latestUpdate, setLatestUpdate] = useState<AnalyticsUpdate | null>(null)

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    const token = localStorage.getItem('auth_token') || ''

    const newSocket = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('analytics:update', (data: AnalyticsUpdate) => {
      setLatestUpdate(data)
    })

    newSocket.on('analytics:batch-update', (data: any) => {
      setLatestUpdate({
        timestamp: Date.now(),
        eventType: 'batch-update',
        data
      })
    })

    newSocket.on('analytics:event-processed', (data: any) => {
      setLatestUpdate({
        timestamp: Date.now(),
        eventType: 'event-processed',
        data
      })
    })

    newSocket.on('analytics:snapshot-recorded', (data: any) => {
      setLatestUpdate({
        timestamp: Date.now(),
        eventType: 'snapshot-recorded',
        data
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const subscribeToEvent = useCallback(
    (eventName: string, callback: (data: any) => void) => {
      if (socket) {
        socket.on(`analytics:${eventName}`, callback)

        return () => {
          socket.off(`analytics:${eventName}`, callback)
        }
      }
    },
    [socket]
  )

  return {
    socket,
    isConnected,
    latestUpdate,
    subscribeToEvent
  }
}
