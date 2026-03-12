/**
 * Error notification system with toast notifications
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from 'react';
import { PassportXError, ErrorSeverity } from '../../lib/errors/ErrorTypes';
import { errorHandler } from '../../lib/errors/ErrorHandler';

export interface ErrorNotification {
  id: string;
  error: PassportXError;
  timestamp: number;
  dismissed: boolean;
  autoHide: boolean;
  duration: number;
}

interface ErrorNotificationState {
  notifications: ErrorNotification[];
  maxNotifications: number;
}

type ErrorNotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: ErrorNotification }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string };

interface ErrorNotificationContextType {
  notifications: ErrorNotification[];
  addNotification: (
    error: PassportXError,
    options?: NotificationOptions
  ) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

interface NotificationOptions {
  autoHide?: boolean;
  duration?: number;
}

const ErrorNotificationContext =
  createContext<ErrorNotificationContextType | null>(null);

const initialState: ErrorNotificationState = {
  notifications: [],
  maxNotifications: 5,
};

function errorNotificationReducer(
  state: ErrorNotificationState,
  action: ErrorNotificationAction
): ErrorNotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.payload, ...state.notifications];
      // Keep only the most recent notifications
      return {
        ...state,
        notifications: newNotifications.slice(0, state.maxNotifications),
      };
    }

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload
            ? { ...notification, dismissed: true }
            : notification
        ),
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };

    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };

    default:
      return state;
  }
}

export const ErrorNotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [state, dispatch] = useReducer(errorNotificationReducer, initialState);

  const addNotification = useCallback(
    (error: PassportXError, options: NotificationOptions = {}) => {
      const {
        autoHide = error.severity !== ErrorSeverity.CRITICAL,
        duration = getDurationBySeverity(error.severity),
      } = options;

      const notification: ErrorNotification = {
        id: `notification_${error.id}_${Date.now()}`,
        error,
        timestamp: Date.now(),
        dismissed: false,
        autoHide,
        duration,
      };

      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

      // Auto-hide notification if configured
      if (autoHide) {
        setTimeout(() => {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
        }, duration);
      }
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    dispatch({ type: 'DISMISS_NOTIFICATION', payload: id });
    // Remove after animation
    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    }, 300);
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  }, []);

  const contextValue: ErrorNotificationContextType = {
    notifications: state.notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
  };

  return (
    <ErrorNotificationContext.Provider value={contextValue}>
      {children}
      <ErrorNotificationContainer />
    </ErrorNotificationContext.Provider>
  );
};

function getDurationBySeverity(severity: ErrorSeverity): number {
  switch (severity) {
    case ErrorSeverity.LOW:
      return 3000;
    case ErrorSeverity.MEDIUM:
      return 5000;
    case ErrorSeverity.HIGH:
      return 8000;
    case ErrorSeverity.CRITICAL:
      return 0; // Never auto-hide
    default:
      return 5000;
  }
}

const ErrorNotificationContainer: React.FC = () => {
  const context = useContext(ErrorNotificationContext);

  if (!context) {
    return null;
  }

  const { notifications, dismissNotification } = context;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <ErrorNotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface ErrorNotificationToastProps {
  notification: ErrorNotification;
  onDismiss: () => void;
}

const ErrorNotificationToast: React.FC<ErrorNotificationToastProps> = ({
  notification,
  onDismiss,
}) => {
  const { error, dismissed } = notification;

  const getSeverityStyles = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case ErrorSeverity.HIGH:
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case ErrorSeverity.CRITICAL:
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return (
          <svg
            className="h-5 w-5 text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      case ErrorSeverity.MEDIUM:
        return (
          <svg
            className="h-5 w-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return (
          <svg
            className="h-5 w-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${
          dismissed ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        }
        max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
        ${getSeverityStyles(error.severity)}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getSeverityIcon(error.severity)}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium">
              {error.category.replace('_', ' ')} Error
            </p>
            <p className="mt-1 text-sm">{error.userMessage}</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="mt-1 text-xs opacity-75">ID: {error.id}</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onDismiss}
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const useErrorNotifications = () => {
  const context = useContext(ErrorNotificationContext);

  if (!context) {
    throw new Error(
      'useErrorNotifications must be used within an ErrorNotificationProvider'
    );
  }

  return context;
};

// Hook to automatically show notifications for errors
export const useAutoErrorNotifications = () => {
  const { addNotification } = useErrorNotifications();

  useEffect(() => {
    const originalHandleError = errorHandler.handleError.bind(errorHandler);

    // Override the error handler to automatically show notifications
    errorHandler.handleError = async (error, context) => {
      const passportXError = await originalHandleError(error, context);

      // Show notification for user-facing errors
      if (passportXError.severity !== ErrorSeverity.LOW) {
        addNotification(passportXError);
      }

      return passportXError;
    };

    return () => {
      // Restore original handler on cleanup
      errorHandler.handleError = originalHandleError;
    };
  }, [addNotification]);
};
