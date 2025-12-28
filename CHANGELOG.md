# Changelog

## Unreleased

- Feature: Session management and persistence for WalletConnect connections
  - Added `src/utils/walletSession.ts` for saving, loading, recovering and clearing sessions
  - Added `src/context/WalletSessionContext.tsx` provider and `useWalletSession` hook
  - Storage adapter and optional Web Crypto helpers for client-side encryption
  - Demo component `src/components/WalletConnectDemo.tsx` to exercise connect/disconnect flows
  - Unit tests for persistence and expiration under `tests/unit`

- Feature: Error handling & recovery (WalletConnect)
  - Added `src/components/ErrorBoundary.tsx`, `src/components/ErrorToast.tsx`, and `src/components/FallbackUI.tsx`
  - Added `src/utils/retry.ts` and `src/utils/logger.ts` for retry logic and logging
  - Integrated error handling into `WalletSessionProvider` and surfaced `error` + `retryOperation`
  - Added unit tests for retry, ErrorBoundary, and logger

