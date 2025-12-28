/**
 * Create a React context for authentication.
 * Manages signing, token generation, and session verification.
 */

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { AuthToken, isTokenExpired } from '../types/auth';
import { retrieveAuthToken, storeAuthToken, clearAuthToken } from '../utils/tokenStorage';
import { verifySignature, isSignatureExpired, SignedMessage } from '../utils/signatureVerification';
import { createAuthToken } from '../utils/sessionTokens';
import { logInfo, logError } from '../utils/logger';

type AuthContextValue = {
  token: AuthToken | null;
  isAuthenticated: boolean;
  signIn: (account: string) => Promise<AuthToken | null>;
  signOut: () => void;
  verifyToken: (token: AuthToken) => boolean;
  error: Error | null;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<AuthToken | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const verifyToken = useCallback((tok: AuthToken) => {
    if (isTokenExpired(tok)) {
      logInfo('Token expired');
      return false;
    }
    return true;
  }, []);

  const signIn = useCallback(
    async (account: string): Promise<AuthToken | null> => {
      try {
        const newToken = createAuthToken(account);
        const ok = await storeAuthToken(newToken);
        if (ok) {
          setToken(newToken);
          return newToken;
        }
        return null;
      } catch (e) {
        logError('Sign in failed', e);
        setError(e as Error);
        return null;
      }
    },
    []
  );

  const signOut = useCallback(() => {
    clearAuthToken();
    setToken(null);
  }, []);

  // Recover token on mount
  useEffect(() => {
    const stored = retrieveAuthToken();
    if (stored && verifyToken(stored)) {
      setToken(stored);
    } else if (stored) {
      clearAuthToken();
    }
  }, [verifyToken]);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, signIn, signOut, verifyToken, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
