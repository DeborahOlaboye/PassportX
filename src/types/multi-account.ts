export interface Account {
  address: string;
  name?: string;
  chainId: number;
  balance?: string;
  isActive: boolean;
  lastUsed?: number;
  metadata?: {
    avatar?: string;
    email?: string;
    displayName?: string;
  };
}

export interface AccountList {
  accounts: Account[];
  activeAddress: string;
  lastSync?: number;
}

export interface AccountPreferences {
  selectedAccount: string;
  accounts: Record<string, AccountSettings>;
  hideBalances: boolean;
  sortOrder: 'recent' | 'alphabetical' | 'custom';
}

export interface AccountSettings {
  displayName?: string;
  avatar?: string;
  pinned: boolean;
  customColor?: string;
  notifications: boolean;
  lastAccessed: number;
}

export interface AccountSwitchEvent {
  from: Account;
  to: Account;
  timestamp: number;
  reason?: 'user' | 'auto' | 'required';
}

export interface MultiAccountState {
  accounts: Account[];
  activeAccount: Account | null;
  isLoading: boolean;
  error: string | null;
  preferences: AccountPreferences;
}

export enum AccountSortOption {
  RECENT = 'recent',
  ALPHABETICAL = 'alphabetical',
  CUSTOM = 'custom',
  BALANCE = 'balance',
}

export interface AccountFilter {
  chainId?: number;
  sortBy?: AccountSortOption;
  searchTerm?: string;
  includeInactive?: boolean;
}

export interface AccountValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
