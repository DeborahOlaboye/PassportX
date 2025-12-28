import React, { createContext, useCallback, useEffect, useState } from 'react';
import { WalletSession, recoverSession, saveSession, clearSession, isExpired } from '../utils/walletSession';

type WalletSessionContextValue = {
  session: WalletSession | null;
  isConnected: boolean;
  save: (s: WalletSession) => Promise<boolean>;
  disconnect: () => void;
  recover: () => Promise<void>;
};

export const WalletSessionContext = createContext<WalletSessionContextValue | undefined>(undefined);

export const WalletSessionProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [session, setSession] = useState<WalletSession | null>(null);

  const save = useCallback(async (s: WalletSession) => {
    const ok = await saveSession(s as any);
    if (ok) setSession(s);
    return ok;
  }, []);

  const disconnect = useCallback(() => {
    clearSession();
    setSession(null);
    // additional WalletConnect disconnect hooks may be invoked by consumers
  }, []);

  const recover = useCallback(async () => {
    const s = await recoverSession();
    if (!s) return;
    if (isExpired(s)) {
      clearSession();
      setSession(null);
      return;
    }
    setSession(s);
  }, []);

  useEffect(() => {
    // attempt recovery on mount
    recover();
  }, [recover]);

  return (
    <WalletSessionContext.Provider value={{ session, isConnected: !!session, save, disconnect, recover }}>
      {children}
    </WalletSessionContext.Provider>
  );
};

export default WalletSessionProvider;
