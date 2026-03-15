'use client';

import React, { useState } from 'react';
import { WalletSessionProvider } from '../context/WalletSessionContext';
import { useWalletSession } from '../hooks/useWalletSession';
import ErrorToast from './ErrorToast';
import ErrorBoundary from './ErrorBoundary';
import { WalletErrorFallback } from './FallbackUI';

const DemoInner: React.FC = () => {
  const { session, save, disconnect, isConnected, error } =
    useWalletSession() as ReturnType<typeof useWalletSession> & {
      error: { message?: string } | null;
    };
  const [showError, setShowError] = useState(false);

  const connect = async () => {
    const s = {
      id: 'demo-' + Date.now(),
      accounts: ['demo-account'],
      connectedAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60, // 1h
    };
    try {
      await save(s as Parameters<typeof save>[0]);
    } catch (e) {
      setShowError(true);
    }
  };

  return (
    <div>
      <div data-testid="session-status">
        {isConnected ? 'connected' : 'disconnected'}
      </div>
      <div data-testid="session-id">{session?.id ?? 'none'}</div>
      <button data-testid="connect-wallet" onClick={connect}>
        Connect (demo)
      </button>
      <button data-testid="disconnect-wallet" onClick={disconnect}>
        Disconnect
      </button>
      {error && showError && (
        <ErrorToast
          message={error.message || 'Connection error'}
          onClose={() => setShowError(false)}
        />
      )}
    </div>
  );
};

export const WalletConnectDemo: React.FC = () => (
  <WalletSessionProvider>
    <ErrorBoundary
      fallback={(error, reset) => (
        <WalletErrorFallback error={error} reset={reset} />
      )}
    >
      <DemoInner />
    </ErrorBoundary>
  </WalletSessionProvider>
);

export default WalletConnectDemo;
