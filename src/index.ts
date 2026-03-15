export { WalletSessionProvider } from './context/WalletSessionContext';
export { useWalletSession } from './hooks/useWalletSession';
export * from './utils/walletSession';
export { ErrorBoundary } from './components/ErrorBoundary';
export { default as ErrorToast } from './components/ErrorToast';
export { default as FallbackUI } from './components/FallbackUI';
// AuthProvider and useAuth re-exported from the canonical Stacks-wallet-based
// auth context. The SDK token-based context (context/AuthContext) is kept for
// backwards compatibility but should not be used in new code.
export { AuthProvider, useAuth } from './hooks/useAuth';
export type { User, AuthContextType } from './hooks/useAuth';
export * from './utils/messageSigning';
export * from './utils/signatureVerification';
export * from './utils/tokenStorage';
export * from './utils/sessionTokens';
export * from './types/auth';
