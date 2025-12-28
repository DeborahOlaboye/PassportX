# Changelog

## Unreleased

- Feature: Session management and persistence for WalletConnect connections
  - Added `src/utils/walletSession.ts` for saving, loading, recovering and clearing sessions
  - Added `src/context/WalletSessionContext.tsx` provider and `useWalletSession` hook
  - Storage adapter and optional Web Crypto helpers for client-side encryption
  - Demo component `src/components/WalletConnectDemo.tsx` to exercise connect/disconnect flows
  - Unit tests for persistence and expiration under `tests/unit`
