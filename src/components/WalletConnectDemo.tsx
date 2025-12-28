import React, { useState } from 'react';
import { WalletSessionProvider } from '../context/WalletSessionContext';
import { useWalletSession } from '../hooks/useWalletSession';
import { generateKeyFromPassword, encrypt } from '../utils/crypto';
import ErrorToast from './ErrorToast';

const DemoInner: React.FC = () => {
  const { session, save, disconnect, isConnected } = useWalletSession();
  const [useSession, setUseSession] = useState(false);
  const { error, retryOperation } = useWalletSession() as any;
  const [showError, setShowError] = useState(false);

  const createEncryptor = async (password: string) => {
    const { key } = await generateKeyFromPassword(password);
    return async (payload: string) => encrypt(key, payload);
  };

  const connect = async () => {
    const s = {
      id: 'demo-' + Date.now(),
      accounts: ['demo-account'],
      connectedAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 // 1h
    };
    try {
      await save(s as any);
    } catch (e) {
      setShowError(true);
    }
  };

  return (
    <div>
      <div data-testid="session-status">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="session-id">{session?.id ?? 'none'}</div>
      <label>
        <input type="checkbox" checked={useSession} onChange={(e) => setUseSession(e.target.checked)} /> Use sessionStorage
      </label>
      <button data-testid="connect-wallet" onClick={connect}>Connect (demo)</button>
      <button data-testid="disconnect-wallet" onClick={disconnect}>Disconnect</button>
      {error && showError && <ErrorToast message={error.message || 'Connection error'} onClose={() => setShowError(false)} />}
    </div>
  );
};

export const WalletConnectDemo: React.FC = () => (
  <WalletSessionProvider>
    <DemoInner />
  </WalletSessionProvider>
);

export default WalletConnectDemo;
