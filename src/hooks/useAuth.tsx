'use client';

/**
 * Re-exports the canonical `useAuth` hook from the app's AuthContext so that
 * SDK consumers and internal code can import it from a single stable location.
 *
 * Previously this file wrapped the SDK token-based context (`context/AuthContext`),
 * which has a completely different API from the app's Stacks-wallet-based context
 * (`contexts/AuthContext`). That mismatch caused a silent runtime failure whenever
 * the hook was used inside the app's provider tree.
 */
export { useAuth, AuthProvider } from '@/contexts/AuthContext';
export type { AuthContextType, User } from '@/contexts/AuthContext';
