import { useEffect, useCallback, useRef } from 'react';
import { useMultiAccount } from '@/contexts/MultiAccountContext';
import { Account } from '@/types/multi-account';

export interface AccountDetectionConfig {
  autoSwitch?: boolean;
  debounceMs?: number;
  onDetected?: (accounts: Account[]) => void;
  onChanged?: (account: Account) => void;
}

export function useMultiAccountDetection(config: AccountDetectionConfig = {}) {
  const { state, addAccount, switchAccount, onAccountSwitch } = useMultiAccount();
  const debounceTimer = useRef<NodeJS.Timeout>();
  const previousAccounts = useRef<string[]>([]);

  const {
    autoSwitch = true,
    debounceMs = 500,
    onDetected,
    onChanged,
  } = config;

  const detectAccountChanges = useCallback(async () => {
    const currentAddresses = state.accounts.map((a) => a.address);

    // Check for new accounts
    const newAccounts = currentAddresses.filter(
      (addr) => !previousAccounts.current.includes(addr)
    );

    // Check for removed accounts
    const removedAccounts = previousAccounts.current.filter(
      (addr) => !currentAddresses.includes(addr)
    );

    if (newAccounts.length > 0 || removedAccounts.length > 0) {
      onDetected?.(state.accounts);

      // Auto-switch to first new account if enabled
      if (autoSwitch && newAccounts.length > 0 && !state.activeAccount) {
        const firstNewAccount = state.accounts.find(
          (a) => newAccounts.includes(a.address)
        );
        if (firstNewAccount) {
          await switchAccount(firstNewAccount.address, 'auto');
          onChanged?.(firstNewAccount);
        }
      }
    }

    previousAccounts.current = currentAddresses;
  }, [state.accounts, state.activeAccount, autoSwitch, onDetected, onChanged, switchAccount]);

  const triggerDetection = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      detectAccountChanges();
    }, debounceMs);
  }, [detectAccountChanges, debounceMs]);

  // Initial detection
  useEffect(() => {
    triggerDetection();

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [triggerDetection]);

  // Listen for account changes
  useEffect(() => {
    if (state.activeAccount && onChanged) {
      onChanged(state.activeAccount);
    }
  }, [state.activeAccount, onChanged]);

  const getDetectedAccounts = useCallback((): Account[] => {
    return state.accounts;
  }, [state.accounts]);

  const getAccountCount = useCallback((): number => {
    return state.accounts.length;
  }, [state.accounts]);

  const hasAccountChanges = useCallback((): boolean => {
    const currentAddresses = state.accounts.map((a) => a.address);
    return currentAddresses.length !== previousAccounts.current.length ||
      currentAddresses.some((addr) => !previousAccounts.current.includes(addr));
  }, [state.accounts]);

  return {
    accounts: getDetectedAccounts(),
    accountCount: getAccountCount(),
    activeAccount: state.activeAccount,
    hasChanges: hasAccountChanges(),
    detectChanges: triggerDetection,
    isLoading: state.isLoading,
    error: state.error,
  };
}
