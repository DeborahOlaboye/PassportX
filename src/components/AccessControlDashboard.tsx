import React from 'react';
import { usePermissionState } from '../hooks/usePermissionState';

export interface AccessControlDashboardProps {
  userPrincipal?: string;
  showSecurityAlerts?: boolean;
}

export const AccessControlDashboard: React.FC<AccessControlDashboardProps> = ({
  userPrincipal,
  showSecurityAlerts = false
}) => {
  const {
    notifications,
    securityAlerts,
    isConnected,
    lastUpdate,
    getCriticalNotifications,
    clearNotifications
  } = usePermissionState({
    userPrincipal,
    subscribeToSecurity: showSecurityAlerts
  });

  const criticalNotifications = getCriticalNotifications();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    return eventType.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="access-control-dashboard">
      {/* Connection Status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {lastUpdate && (
            <span className="text-xs text-gray-400">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <button
            onClick={clearNotifications}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Critical Notifications Alert */}
      {criticalNotifications.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            ⚠️ {criticalNotifications.length} Critical Notification{criticalNotifications.length > 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-red-700">
            Your permissions have been modified. Please review immediately.
          </p>
        </div>
      )}

      {/* Security Alerts */}
      {showSecurityAlerts && securityAlerts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Security Alerts</h3>
          <div className="space-y-2">
            {securityAlerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <p className="text-xs mt-1">{alert.description}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase">
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Recent Activity
          {notifications.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({notifications.length})
            </span>
          )}
        </h3>

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No permission changes detected</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${getSeverityColor(notification.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {getEventTypeLabel(notification.eventType)}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-white rounded">
                        {notification.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="mt-1 text-xs space-y-1">
                      <div>Principal: {notification.principal.slice(0, 20)}...</div>
                      {notification.targetPrincipal && (
                        <div>Target: {notification.targetPrincipal.slice(0, 20)}...</div>
                      )}
                      {notification.communityId && (
                        <div>Community: {notification.communityId}</div>
                      )}
                    </div>

                    {Object.keys(notification.data).length > 0 && (
                      <div className="mt-2 text-xs">
                        <details className="cursor-pointer">
                          <summary className="font-semibold">Details</summary>
                          <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                            {JSON.stringify(notification.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-right ml-3">
                    <div>{new Date(notification.timestamp).toLocaleTimeString()}</div>
                    <div className="text-xs opacity-70">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessControlDashboard;
