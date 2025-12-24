import { useState, useEffect, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseActivityFeedReturn {
  socket: Socket | null
  isConnected: boolean
  error: string | null
}

export function useActivityFeed(userId: string): UseActivityFeedReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setError('User ID is required')
      return
    }

    try {
      const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const token = localStorage.getItem('auth_token') || ''

      if (!token) {
        setError('Authentication token not found')
        return
      }

      const newSocket = io(socketUrl, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      })

      newSocket.on('connect', () => {
        setIsConnected(true)
        setError(null)
        newSocket.emit('activity:subscribe', { userId })
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
      })

      newSocket.on('connect_error', (err: Error) => {
        setError(err.message)
        setIsConnected(false)
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize socket'
      setError(errorMessage)
    }
  }, [userId])

  return { socket, isConnected, error }
}
