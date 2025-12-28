import React from 'react';
import { WalletSessionProvider } from '../context/WalletSessionContext';
import { useWalletSession } from '../hooks/useWalletSession';

const DemoInner: React.FC = () => {
  const { session, save, disconnect, isConnected } = useWalletSession();

  const connect = async () => {
    const s = {
      id: 'demo-' + Date.now(),
      accounts: ['demo-account'],
      connectedAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 // 1h
    };
    await save(s as any);
  };

  return (
    <div>
      <div data-testid="session-status">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="session-id">{session?.id ?? 'none'}</div>
      <button data-testid="connect-wallet" onClick={connect}>Connect (demo)</button>
      <button data-testid="disconnect-wallet" onClick={disconnect}>Disconnect</button>
    </div>
  );
};

export const WalletConnectDemo: React.FC = () => (
  <WalletSessionProvider>
    <DemoInner />
  </WalletSessionProvider>
);

export default WalletConnectDemo;
