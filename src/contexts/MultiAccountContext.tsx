'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  Account,
  AccountPreferences,
  AccountSwitchEvent,
  MultiAccountState,
  AccountFilter,
} from '@/types/multi-account';

interface MultiAccountContextType {
  state: MultiAccountState;
  addAccount: (account: Account) => Promise<void>;
  removeAccount: (address: string) => Promise<void>;
  switchAccount: (address: string, reason?: 'user' | 'auto') => Promise<void>;
  updateAccountSettings: (address: string, settings: Partial<any>) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  filterAccounts: (filter: AccountFilter) => Account[];
  getAccountByAddress: (address: string) => Account | undefined;
  hasMultipleAccounts: () => boolean;
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
  clearError: () => void;
  onAccountSwitch?: (event: AccountSwitchEvent) => void;
}

const MultiAccountContext = createContext<MultiAccountContextType | undefined>(undefined);

interface MultiAccountProviderProps {
  children: ReactNode;
  onAccountSwitch?: (event: AccountSwitchEvent) => void;
}

const DEFAULT_PREFERENCES: AccountPreferences = {
  selectedAccount: '',
  accounts: {},
  hideBalances: false,
  sortOrder: 'recent',
};

export function MultiAccountProvider({
  children,
  onAccountSwitch,
}: MultiAccountProviderProps) {
  const [state, setState] = useState<MultiAccountState>({
    accounts: [],
    activeAccount: null,
    isLoading: false,
    error: null,
    preferences: DEFAULT_PREFERENCES,
  });

  const addAccount = useCallback(async (account: Account) => {
    try {
      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts.filter((a) => a.address !== account.address), account],
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add account';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const removeAccount = useCallback(async (address: string) => {
    try {
      setState((prev) => {
        const filtered = prev.accounts.filter((a) => a.address !== address);
        const newActive = prev.activeAccount?.address === address ? filtered[0] || null : prev.activeAccount;

        return {
          ...prev,
          accounts: filtered,
          activeAccount: newActive,
          error: null,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove account';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const switchAccount = useCallback(async (address: string, reason: 'user' | 'auto' = 'user') => {
    try {
      setState((prev) => {
        const newActive = prev.accounts.find((a) => a.address === address);
        if (!newActive) {
          throw new Error(`Account ${address} not found`);
        }

        const oldActive = prev.activeAccount;

        if (oldActive && onAccountSwitch) {
          onAccountSwitch({
            from: oldActive,
            to: newActive,
            timestamp: Date.now(),
            reason,
          });
        }

        const updatedAccounts = prev.accounts.map((a) => ({
          ...a,
          isActive: a.address === address,
          lastUsed: a.address === address ? Date.now() : a.lastUsed,
        }));

        const updatedPreferences = {
          ...prev.preferences,
          selectedAccount: address,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('account_preferences', JSON.stringify(updatedPreferences));
        }

        return {
          ...prev,
          accounts: updatedAccounts,
          activeAccount: newActive,
          preferences: updatedPreferences,
          error: null,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch account';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [onAccountSwitch]);

  const updateAccountSettings = useCallback(
    async (address: string, settings: Partial<any>) => {
      try {
        setState((prev) => ({
          ...prev,
          preferences: {
            ...prev.preferences,
            accounts: {
              ...prev.preferences.accounts,
              [address]: {
                ...prev.preferences.accounts[address],
                ...settings,
                lastAccessed: Date.now(),
              },
            },
          },
          error: null,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    []
  );

  const refreshAccounts = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      // Placeholder for actual account refresh logic
      // This would normally fetch accounts from wallet provider
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh accounts';
      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const filterAccounts = useCallback((filter: AccountFilter): Account[] => {
    let filtered = state.accounts;

    if (filter.chainId !== undefined) {
      filtered = filtered.filter((a) => a.chainId === filter.chainId);
    }

    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.address.toLowerCase().includes(term) ||
          a.name?.toLowerCase().includes(term) ||
          a.metadata?.displayName?.toLowerCase().includes(term)
      );
    }

    if (!filter.includeInactive) {
      filtered = filtered.filter((a) => a.isActive || a.address === state.activeAccount?.address);
    }

    switch (filter.sortBy) {
      case 'alphabetical':
        return filtered.sort((a, b) => (a.name || a.address).localeCompare(b.name || b.address));
      case 'balance':
        return filtered.sort((a, b) => {
          const balA = parseFloat(a.balance || '0');
          const balB = parseFloat(b.balance || '0');
          return balB - balA;
        });
      case 'recent':
      default:
        return filtered.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    }
  }, [state.accounts, state.activeAccount]);

  const getAccountByAddress = useCallback(
    (address: string) => state.accounts.find((a) => a.address === address),
    [state.accounts]
  );

  const hasMultipleAccounts = useCallback(() => state.accounts.length > 1, [state.accounts]);

  const loadPreferences = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;

      const stored = localStorage.getItem('account_preferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        setState((prev) => ({
          ...prev,
          preferences: prefs,
          error: null,
        }));
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  const savePreferences = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem('account_preferences', JSON.stringify(state.preferences));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save preferences';
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [state.preferences]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const value: MultiAccountContextType = {
    state,
    addAccount,
    removeAccount,
    switchAccount,
    updateAccountSettings,
    refreshAccounts,
    filterAccounts,
    getAccountByAddress,
    hasMultipleAccounts,
    loadPreferences,
    savePreferences,
    clearError,
    onAccountSwitch,
  };

  return (
    <MultiAccountContext.Provider value={value}>{children}</MultiAccountContext.Provider>
  );
}

export function useMultiAccount() {
  const context = useContext(MultiAccountContext);
  if (context === undefined) {
    throw new Error('useMultiAccount must be used within a MultiAccountProvider');
  }
  return context;
}
