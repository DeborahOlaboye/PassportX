import { useEffect, useState, useCallback } from 'react';
import { useWalletConnect, ConnectedWallet } from '@/contexts/WalletConnectContext';
import { loadSessionFromStorage, clearSessionFromStorage } from '@/utils/walletConnect';

export interface WalletSession {
  wallet: ConnectedWallet;
  sessionId: string;
  connectedAt: number;
  expiresAt?: number;
}

const SESSION_STORAGE_KEY = 'walletconnect_session';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export function useWalletSession() {
  const { connectWallet, disconnectWallet, connectedWallet } = useWalletConnect();
  const [session, setSession] = useState<WalletSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);

      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const storedSession = await loadSessionFromStorage(SESSION_STORAGE_KEY);

      if (storedSession && typeof storedSession === 'object') {
        const sessionData = storedSession as WalletSession;
        const now = Date.now();

        if (sessionData.expiresAt && now > sessionData.expiresAt) {
          await clearSessionFromStorage(SESSION_STORAGE_KEY);
          setSession(null);
          return;
        }

        setSession(sessionData);
        if (sessionData.wallet) {
          await connectWallet(sessionData.wallet);
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [connectWallet]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (connectedWallet) {
      const newSession: WalletSession = {
        wallet: connectedWallet,
        sessionId: connectedWallet.sessionTopic || `session_${Date.now()}`,
        connectedAt: Date.now(),
        expiresAt: Date.now() + SESSION_TIMEOUT,
      };

      setSession(newSession);

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
      }
    }
  }, [connectedWallet]);

  const clearSession = useCallback(async () => {
    try {
      setSession(null);
      await disconnectWallet();
      await clearSessionFromStorage(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }, [disconnectWallet]);

  const refreshSession = useCallback(async () => {
    if (session) {
      const updatedSession: WalletSession = {
        ...session,
        expiresAt: Date.now() + SESSION_TIMEOUT,
      };

      setSession(updatedSession);

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      }
    }
  }, [session]);

  const isSessionExpired = useCallback((): boolean => {
    if (!session || !session.expiresAt) return false;
    return Date.now() > session.expiresAt;
  }, [session]);

  return {
    session,
    isLoading,
    clearSession,
    refreshSession,
    isSessionExpired,
    restoreSession,
  };
}
