# Changelog

## Unreleased

- Feature: Comprehensive test suite for Chainhook integration
  - Added `src/types/chainhook.ts` with event types and predicate definitions
  - Added `src/utils/predicateEvaluator.ts` for evaluating event predicates with fluent builder API
  - Added `src/utils/mockChainhookEvents.ts` factory for creating realistic mock events
  - Added `src/utils/eventHandlerRegistry.ts` for registering and dispatching event handlers
  - Added `src/utils/reorgHandler.ts` for tracking blockchain reorganizations and recovery
  - Added predicate logic unit tests: `tests/unit/chainhook.predicates.test.ts` (14 tests)
  - Added event handler unit tests: `tests/unit/chainhook.handlers.test.ts` (11 tests)
  - Added reorg handling unit tests: `tests/unit/chainhook.reorg.test.ts` (20 tests)
  - Added integration tests: `tests/integration/chainhook.integration.test.ts` (15 tests)
  - Added performance tests: `tests/performance/chainhook.performance.test.ts` (15 tests)
  - Added E2E test scenarios: `tests/e2e/chainhook.e2e.test.ts` (10 tests)
  - Coverage: 85+ tests covering predicates, handlers, reorg scenarios, and high-volume processing
  - Supports monitoring badge mint, community creation, metadata updates, revocations, and reorg events
  - Includes reorg-aware event processor to prevent processing of affected transactions
  - Performance optimized for 1000+ events and 500+ predicates

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

- Feature: Message signing for user authentication
  - Added `src/utils/messageSigning.ts` to create and format messages for signing with domain and timestamp replay attack prevention
  - Added `src/utils/signatureVerification.ts` to verify signatures and check expiration windows
  - Added `src/types/auth.ts` with `AuthToken` and `AuthSession` interfaces including expiry helpers
  - Added `src/utils/tokenStorage.ts` for secure storage and retrieval of auth tokens with optional encryption
  - Added `src/utils/sessionTokens.ts` for generating and validating session tokens
  - Added `src/context/AuthContext.tsx` React provider managing sign-in, sign-out, and token verification flows
  - Added `src/hooks/useAuth.tsx` hook for consuming auth state and methods throughout components
  - Added `src/components/AuthDemo.tsx` demo component showing authentication UI and flows
  - Unit tests for message signing, token management, and auth context with 20+ test cases
  - **Security Note**: User's private keys never exposed; signing remains with user's wallet provider

