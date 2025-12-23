import { useCallback, useEffect, useState } from 'react';
import { useMultiAccount } from '@/contexts/MultiAccountContext';
import { AccountPreferences, AccountSettings, AccountSortOption } from '@/types/multi-account';
import {
  loadPreferences,
  savePreferences,
  loadAccountSettings,
  saveAccountSettings,
} from '@/utils/account-storage';

export function useAccountPreferences() {
  const { state, savePreferences: contextSavePreferences, updateAccountSettings } =
    useMultiAccount();
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await contextSavePreferences();
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [contextSavePreferences]);

  const updatePreference = useCallback(
    async (key: keyof AccountPreferences, value: any) => {
      try {
        const updated = {
          ...state.preferences,
          [key]: value,
        };

        await savePreferences(updated);
        return updated;
      } catch (error) {
        console.error(`Failed to update preference ${key}:`, error);
        throw error;
      }
    },
    [state.preferences]
  );

  const setSortOrder = useCallback(
    async (sortOrder: AccountSortOption) => {
      return updatePreference('sortOrder', sortOrder);
    },
    [updatePreference]
  );

  const setHideBalances = useCallback(
    async (hide: boolean) => {
      return updatePreference('hideBalances', hide);
    },
    [updatePreference]
  );

  const getAccountSettings = useCallback(
    async (address: string): Promise<AccountSettings | null> => {
      try {
        const stored = state.preferences.accounts[address];
        if (stored) return stored;

        // Try to load from persistent storage
        return await loadAccountSettings(address);
      } catch (error) {
        console.error('Failed to get account settings:', error);
        return null;
      }
    },
    [state.preferences.accounts]
  );

  const updateAccountPreference = useCallback(
    async (address: string, settings: Partial<AccountSettings>) => {
      try {
        const current = await getAccountSettings(address);
        const updated = {
          ...current,
          ...settings,
          lastAccessed: Date.now(),
        } as AccountSettings;

        await saveAccountSettings(address, updated);
        await updateAccountSettings(address, updated);

        return updated;
      } catch (error) {
        console.error('Failed to update account preference:', error);
        throw error;
      }
    },
    [getAccountSettings, updateAccountSettings]
  );

  const pinAccount = useCallback(
    async (address: string) => {
      const current = await getAccountSettings(address);
      return updateAccountPreference(address, { pinned: !current?.pinned });
    },
    [getAccountSettings, updateAccountPreference]
  );

  const setCustomColor = useCallback(
    async (address: string, color: string) => {
      return updateAccountPreference(address, { customColor: color });
    },
    [updateAccountPreference]
  );

  const setDisplayName = useCallback(
    async (address: string, name: string) => {
      return updateAccountPreference(address, { displayName: name });
    },
    [updateAccountPreference]
  );

  const toggleNotifications = useCallback(
    async (address: string) => {
      const current = await getAccountSettings(address);
      return updateAccountPreference(address, { notifications: !current?.notifications });
    },
    [getAccountSettings, updateAccountPreference]
  );

  const resetPreferences = useCallback(async () => {
    try {
      const defaultPrefs: AccountPreferences = {
        selectedAccount: state.preferences.selectedAccount,
        accounts: {},
        hideBalances: false,
        sortOrder: 'recent',
      };

      await savePreferences(defaultPrefs);
      return defaultPrefs;
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      throw error;
    }
  }, [state.preferences.selectedAccount]);

  return {
    preferences: state.preferences,
    isLoading,
    updatePreference,
    setSortOrder,
    setHideBalances,
    getAccountSettings,
    updateAccountPreference,
    pinAccount,
    setCustomColor,
    setDisplayName,
    toggleNotifications,
    resetPreferences,
  };
}
