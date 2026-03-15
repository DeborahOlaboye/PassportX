'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { io, Socket } from 'socket.io-client';
import logger from '@/utils/logger';

interface NotificationData {
  badgeId?: string;
  communityId?: string;
  templateId?: string;
  issuer?: string;
  url?: string;
  [key: string]: string | number | boolean | undefined;
}

interface Notification {
  _id: string;
  userId: string;
  type:
    | 'badge_received'
    | 'community_update'
    | 'system_announcement'
    | 'badge_issued'
    | 'community_invite'
    | 'badge_verified';
  title: string;
  message: string;
  data?: NotificationData;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const BACKEND_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    const socketInstance = io(BACKEND_WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      logger.info('WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      logger.info('WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      logger.error('WebSocket connection error', { error });
      setIsConnected(false);
    });

    // Listen for new notifications
    socketInstance.on('notification:new', (notification: Notification) => {
      logger.debug('New notification received', { notification });
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png',
        });
      }
    });

    // Listen for system announcements
    socketInstance.on('notification:system', (notification: Notification) => {
      logger.info('System announcement received', { notification });
      // Handle system-wide announcements
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(
        '/api/notifications?limit=50&sortBy=newest',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error: unknown) {
      logger.error('Error fetching notifications', { error });
    }
  }, []);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error: unknown) {
      logger.error('Error fetching unread count', { error });
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(
          `/api/notifications/${notificationId}/read`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          setNotifications((prev) =>
            prev.map((n) =>
              n._id === notificationId ? { ...n, read: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));

          // Emit to socket
          if (socket) {
            socket.emit('notification:read', notificationId);
          }
        }
      } catch (error: unknown) {
        logger.error('Error marking notification as read', { error });
      }
    },
    [socket]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);

        // Emit to socket
        if (socket) {
          socket.emit('notifications:readAll');
        }
      }
    } catch (error: unknown) {
      logger.error('Error marking all notifications as read', { error });
    }
  }, [socket]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications((prev) => {
          const notification = prev.find((n) => n._id === notificationId);
          if (notification && !notification.read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n._id !== notificationId);
        });
      }
    } catch (error: unknown) {
      logger.error('Error deleting notification', { error });
    }
  }, []);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications().catch((err: unknown) => {
      logger.error('Failed to fetch notifications on mount', { err });
    });
  }, [fetchNotifications]);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch((err: unknown) => {
        logger.warn('Failed to request notification permission', { err });
      });
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
}
