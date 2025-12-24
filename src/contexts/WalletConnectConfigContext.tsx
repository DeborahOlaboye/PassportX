'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletConnectProviderConfig, InitializationState } from '@/types/walletconnect-config';
import { buildWalletConnectConfig, validateConfig } from '@/config/walletconnect';
import { validateWalletConnectEnv, logEnvironmentValidation } from '@/utils/env-validation';

interface WalletConnectConfigContextType {
  config: WalletConnectProviderConfig | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  initializeConfig: () => Promise<void>;
  resetConfig: () => void;
}

const WalletConnectConfigContext = createContext<
  WalletConnectConfigContextType | undefined
>(undefined);

interface WalletConnectConfigProviderProps {
  children: ReactNode;
}

export function WalletConnectConfigProvider({
  children,
}: WalletConnectConfigProviderProps) {
  const [state, setState] = useState<InitializationState>({
    isInitialized: false,
    isInitializing: false,
  });

  const initializeConfig = async () => {
    try {
      setState((prev) => ({
        ...prev,
        isInitializing: true,
        error: undefined,
      }));

      // Validate environment variables
      const envValidation = validateWalletConnectEnv();
      if (!envValidation.isValid) {
        const errorMessage = envValidation.errors.join(', ');
        throw new Error(`Environment validation failed: ${errorMessage}`);
      }

      const config = buildWalletConnectConfig();

      const validation = validateConfig(config);
      if (!validation.valid) {
        const errorMessage = validation.errors.join(', ');
        throw new Error(`Configuration validation failed: ${errorMessage}`);
      }

      if (process.env.NODE_ENV === 'development') {
        logEnvironmentValidation();
        console.log('WalletConnect Config Initialized:', config);
      }

      setState({
        isInitialized: true,
        isInitializing: false,
        config,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('WalletConnect configuration initialization failed:', errorMessage);

      setState({
        isInitialized: false,
        isInitializing: false,
        error: errorMessage,
      });
    }
  };

  const resetConfig = () => {
    setState({
      isInitialized: false,
      isInitializing: false,
      error: undefined,
      config: undefined,
    });
  };

  useEffect(() => {
    initializeConfig();
  }, []);

  const value: WalletConnectConfigContextType = {
    config: state.config || null,
    isInitialized: state.isInitialized,
    isInitializing: state.isInitializing,
    error: state.error || null,
    initializeConfig,
    resetConfig,
  };

  return (
    <WalletConnectConfigContext.Provider value={value}>
      {children}
    </WalletConnectConfigContext.Provider>
  );
}

export function useWalletConnectConfig() {
  const context = useContext(WalletConnectConfigContext);
  if (context === undefined) {
    throw new Error(
      'useWalletConnectConfig must be used within a WalletConnectConfigProvider'
    );
  }
  return context;
}
