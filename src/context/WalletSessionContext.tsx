import React, { createContext, useCallback, useEffect, useState } from 'react';
import { WalletSession, recoverSession, saveSession, clearSession, isExpired } from '../utils/walletSession';
import { WalletError } from '../utils/errorTypes';
import { logError, logInfo } from '../utils/logger';
import retry from '../utils/retry';

type WalletSessionContextValue = {
  session: WalletSession | null;
  isConnected: boolean;
  save: (s: WalletSession) => Promise<boolean>;
  disconnect: () => void;
  recover: () => Promise<void>;
  error: Error | null;
  retryOperation: <T>(fn: () => Promise<T>, opts?: { retries?: number; delayMs?: number }) => Promise<T>;
};

export const WalletSessionContext = createContext<WalletSessionContextValue | undefined>(undefined);

type ProviderProps = {
  storageArea?: 'local' | 'session';
  encrypt?: (payload: string) => Promise<string> | string;
  decrypt?: (payload: string) => Promise<string> | string;
};

export const WalletSessionProvider: React.FC<React.PropsWithChildren<ProviderProps>> = ({ children, storageArea, encrypt, decrypt }) => {
  const [session, setSession] = useState<WalletSession | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const save = useCallback(async (s: WalletSession) => {
    try {
      const ok = await saveSession(s as any, { area: storageArea as any, encrypt });
      if (ok) setSession(s);
      return ok;
    } catch (e) {
      logError('Failed to save session', e);
      setError(e as Error);
      return false;
    }
  }, [encrypt, storageArea]);

  const disconnect = useCallback(() => {
    clearSession();
    setSession(null);
    // additional WalletConnect disconnect hooks may be invoked by consumers
  }, []);

  const recover = useCallback(async () => {
    try {
      const s = await recoverSession({ area: storageArea as any, decrypt });
      if (!s) return;
      if (isExpired(s)) {
        clearSession();
        setSession(null);
        return;
      }
      setSession(s);
    } catch (e) {
      logError('Failed to recover session', e);
      setError(e as Error);
    }
  }, []);

  const retryOperation = useCallback(async <T,>(fn: () => Promise<T>, opts?: { retries?: number; delayMs?: number }) => {
    try {
      logInfo('Starting retry operation');
      const res = await retry(fn, opts);
      return res as T;
    } catch (e) {
      logError('Retry operation failed', e);
      setError(e as Error);
      throw e;
    }
  }, []);

  useEffect(() => {
    // attempt recovery on mount
    recover();
  }, [recover]);

  return (
    <WalletSessionContext.Provider value={{ session, isConnected: !!session, save, disconnect, recover, error, retryOperation }}>
      {children}
    </WalletSessionContext.Provider>
  );
};

export default WalletSessionProvider;
