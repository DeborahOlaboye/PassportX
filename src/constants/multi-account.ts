export const MULTI_ACCOUNT_CONFIG = {
  MAX_ACCOUNTS: 100,
  MAX_ACCOUNT_NAME_LENGTH: 50,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  DEBOUNCE_DETECTION_MS: 500,
  STORAGE_PREFIX: 'wallet_',
  ISOLATION_PREFIX: 'account_',
};

export const ACCOUNT_SORT_OPTIONS = {
  RECENT: 'recent',
  ALPHABETICAL: 'alphabetical',
  BALANCE: 'balance',
  CUSTOM: 'custom',
} as const;

export const ACCOUNT_ACTIONS = {
  ADD: 'add',
  REMOVE: 'remove',
  SWITCH: 'switch',
  UPDATE: 'update',
  PIN: 'pin',
  UNPIN: 'unpin',
  RENAME: 'rename',
} as const;

export const ACCOUNT_MESSAGES = {
  ADDED: 'Account added successfully',
  REMOVED: 'Account removed',
  SWITCHED: 'Account switched',
  UPDATED: 'Account settings updated',
  PINNED: 'Account pinned',
  UNPINNED: 'Account unpinned',
  RENAMED: 'Account renamed',
  INVALID: 'Invalid account',
  DUPLICATE: 'Account already exists',
  NOT_FOUND: 'Account not found',
  EMPTY_LIST: 'No accounts available',
  SWITCH_FAILED: 'Failed to switch account',
  ADD_FAILED: 'Failed to add account',
  REMOVE_FAILED: 'Failed to remove account',
};

export const ACCOUNT_ERRORS = {
  INVALID_ADDRESS: 'Invalid wallet address format',
  INVALID_CHAIN_ID: 'Invalid chain ID',
  INVALID_NAME: 'Invalid account name',
  DUPLICATE_ADDRESS: 'Account already connected',
  MAX_ACCOUNTS_REACHED: `Cannot add more than ${MULTI_ACCOUNT_CONFIG.MAX_ACCOUNTS} accounts`,
  ACTIVE_ACCOUNT_REMOVE: 'Cannot remove the active account',
  STORAGE_ERROR: 'Failed to save to storage',
  LOAD_ERROR: 'Failed to load accounts',
  VALIDATION_ERROR: 'Account validation failed',
  SWITCH_SAME: 'Already on this account',
};

export const STORAGE_KEYS = {
  ACCOUNTS: 'wallet_accounts',
  ACTIVE_ACCOUNT: 'active_account',
  PREFERENCES: 'account_preferences',
  ACCOUNT_SETTINGS_PREFIX: 'account_settings_',
  ACCOUNT_DATA_PREFIX: 'account_data_',
} as const;

export const DEFAULT_ACCOUNT_PREFERENCES = {
  selectedAccount: '',
  accounts: {},
  hideBalances: false,
  sortOrder: 'recent' as const,
};

export const DEFAULT_ACCOUNT_SETTINGS = {
  displayName: '',
  avatar: undefined,
  pinned: false,
  customColor: undefined,
  notifications: true,
  lastAccessed: Date.now(),
};

export const ACCOUNT_VALIDATION_RULES = {
  ADDRESS_PATTERN: /^(SP|SM)[A-Z0-9]{39}$/,
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: MULTI_ACCOUNT_CONFIG.MAX_ACCOUNT_NAME_LENGTH,
  COLOR_PATTERN: /^#[0-9A-F]{6}$/i,
};

export const CHAIN_IDS = {
  STACKS_MAINNET: 1,
  STACKS_TESTNET: 5050,
  STACKS_DEVNET: 5051,
} as const;

export const ACCOUNT_DISPLAY_LIMITS = {
  DROPDOWN_MAX: 5,
  LIST_MAX: 10,
  MODAL_MAX: 20,
};

export const ACCOUNT_SWITCH_REASONS = {
  USER: 'user',
  AUTO: 'auto',
  REQUIRED: 'required',
} as const;

export const UI_ANIMATION_DURATIONS = {
  DROPDOWN_OPEN: 150,
  MODAL_OPEN: 200,
  ACCOUNT_SWITCH: 100,
} as const;
