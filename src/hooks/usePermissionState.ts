import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface PermissionNotification {
  type: 'permission_changed' | 'role_assigned' | 'role_revoked' | 'admin_added' | 'admin_removed' | 'user_suspended' | 'security_alert';
  eventType: string;
  principal: string;
  targetPrincipal?: string;
  communityId?: string;
  data: Record<string, any>;
  timestamp: Date;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  principal: string;
}

export interface UsePermissionStateOptions {
  userPrincipal?: string;
  communityId?: string;
  subscribeToSecurity?: boolean;
  socketUrl?: string;
}

export interface PermissionState {
  notifications: PermissionNotification[];
  securityAlerts: SecurityAlert[];
  isConnected: boolean;
  lastUpdate?: Date;
}

/**
 * Hook to subscribe to real-time permission updates via WebSocket
 */
export function usePermissionState(options: UsePermissionStateOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<PermissionState>({
    notifications: [],
    securityAlerts: [],
    isConnected: false
  });

  const socketUrl = options.socketUrl || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3010';

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to permission updates WebSocket');
      setState(prev => ({ ...prev, isConnected: true }));

      // Subscribe to user-specific updates
      if (options.userPrincipal) {
        newSocket.emit('subscribe:user', options.userPrincipal);
      }

      // Subscribe to community updates
      if (options.communityId) {
        newSocket.emit('subscribe:community', options.communityId);
      }

      // Subscribe to security alerts
      if (options.subscribeToSecurity) {
        newSocket.emit('subscribe:security');
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from permission updates WebSocket');
      setState(prev => ({ ...prev, isConnected: false }));
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Listen for permission updates
    newSocket.on('permission:updated', (notification: PermissionNotification) => {
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications].slice(0, 100), // Keep last 100
        lastUpdate: new Date()
      }));
    });

    newSocket.on('permission:user_updated', (notification: PermissionNotification) => {
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications].slice(0, 100),
        lastUpdate: new Date()
      }));
    });

    newSocket.on('permission:community_updated', (notification: PermissionNotification) => {
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications].slice(0, 100),
        lastUpdate: new Date()
      }));
    });

    newSocket.on('permission:critical_change', (notification: PermissionNotification) => {
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications].slice(0, 100),
        lastUpdate: new Date()
      }));
    });

    newSocket.on('permission:security_alert', (alert: SecurityAlert) => {
      setState(prev => ({
        ...prev,
        securityAlerts: [alert, ...prev.securityAlerts].slice(0, 50),
        lastUpdate: new Date()
      }));
    });

    newSocket.on('security:alert', (alert: SecurityAlert) => {
      setState(prev => ({
        ...prev,
        securityAlerts: [alert, ...prev.securityAlerts].slice(0, 50),
        lastUpdate: new Date()
      }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [socketUrl, options.userPrincipal, options.communityId, options.subscribeToSecurity]);

  // Subscribe to user updates
  const subscribeToUser = useCallback((principal: string) => {
    if (socket) {
      socket.emit('subscribe:user', principal);
    }
  }, [socket]);

  // Unsubscribe from user updates
  const unsubscribeFromUser = useCallback((principal: string) => {
    if (socket) {
      socket.emit('unsubscribe:user', principal);
    }
  }, [socket]);

  // Subscribe to community updates
  const subscribeToCommunity = useCallback((communityId: string) => {
    if (socket) {
      socket.emit('subscribe:community', communityId);
    }
  }, [socket]);

  // Unsubscribe from community updates
  const unsubscribeFromCommunity = useCallback((communityId: string) => {
    if (socket) {
      socket.emit('unsubscribe:community', communityId);
    }
  }, [socket]);

  // Subscribe to security alerts
  const subscribeToSecurityAlerts = useCallback(() => {
    if (socket) {
      socket.emit('subscribe:security');
    }
  }, [socket]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  // Clear security alerts
  const clearSecurityAlerts = useCallback(() => {
    setState(prev => ({ ...prev, securityAlerts: [] }));
  }, []);

  // Get unread critical notifications
  const getCriticalNotifications = useCallback(() => {
    return state.notifications.filter(n =>
      n.severity === 'critical' || n.severity === 'high'
    );
  }, [state.notifications]);

  return {
    ...state,
    subscribeToUser,
    unsubscribeFromUser,
    subscribeToCommunity,
    unsubscribeFromCommunity,
    subscribeToSecurityAlerts,
    clearNotifications,
    clearSecurityAlerts,
    getCriticalNotifications
  };
}
