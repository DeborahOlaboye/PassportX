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

- Feature: Comprehensive unit tests for WalletConnect integration
  - Added connection flow tests: `walletConnect.connection.test.ts` (5 tests)
  - Added session management tests: `walletConnect.session.test.ts` (6 tests)
  - Added transaction signing tests: `walletConnect.signing.test.ts` (6 tests)
  - Added error handling tests: `walletConnect.errors.test.ts` (8 tests)
  - Added state management tests: `walletConnect.state.test.ts` (7 tests)
  - Added end-to-end flow tests: `walletConnect.e2e.test.ts` (4 tests)
  - Added edge case tests: `walletConnect.edge-cases.test.ts` (6 tests)
  - Added transaction flow tests: `walletConnect.transactions.test.ts` (5 tests)
  - Coverage config and CI/CD workflow for automated testing
  - Target coverage: 80%+ across all metrics
  - Added testing guide and coverage report documentation

