'use client';

import React from 'react';
import { useWalletConnectConfig } from '@/hooks/useWalletConnectConfig';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { getConfigurationStatus } from '@/utils/walletconnect-config';

interface ConfigurationStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function ConfigurationStatus({
  showDetails = false,
  className = '',
}: ConfigurationStatusProps) {
  const { config, isInitialized, isInitializing, error } = useWalletConnectConfig();

  if (isInitializing) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-sm text-blue-600">Initializing configuration...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-600" />
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  if (!isInitialized || !config) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertCircle className="w-4 h-4 text-yellow-600" />
        <span className="text-sm text-yellow-600">Configuration not ready</span>
      </div>
    );
  }

  const status = getConfigurationStatus(config);

  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-600 font-medium">Configuration Ready</span>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-3 p-3 bg-gray-50 rounded border border-gray-200 text-xs">
          <div>
            <p className="font-semibold text-gray-900">Project ID</p>
            <p className="text-gray-600 truncate">{config.projectId}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Relay URL</p>
            <p className="text-gray-600 truncate">{config.relayUrl}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Supported Chains</p>
            <ul className="text-gray-600 space-y-1">
              {config.chains.map((chain) => (
                <li key={chain.id}>
                  {chain.name} (ID: {chain.id})
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Methods ({config.methods.length})</p>
            <p className="text-gray-600">{config.methods.join(', ')}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">Events ({config.events.length})</p>
            <p className="text-gray-600">{config.events.join(', ')}</p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">App Metadata</p>
            <div className="text-gray-600 space-y-1">
              <p>Name: {config.metadata.name}</p>
              <p>URL: {config.metadata.url}</p>
              <p>Icons: {config.metadata.icons.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
