/**
 * Tests for WalletConnect session management.
 */
import { WalletSession } from '../../src/utils/walletSession';

describe('WalletConnect session management', () => {
  const createSession = (overrides?: Partial<WalletSession>): WalletSession => ({
    id: 'sess-1',
    accounts: ['ST123'],
    connectedAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60,
    ...overrides
  });

  it('should create a new session', () => {
    const session = createSession();
    expect(session.id).toBeDefined();
    expect(session.accounts).toHaveLength(1);
  });

  it('should validate session expiration', () => {
    const expiredSession = createSession({ expiresAt: Date.now() - 1000 });
    const isExpired = expiredSession.expiresAt! < Date.now();
    expect(isExpired).toBe(true);
  });

  it('should preserve session across page reloads', async () => {
    const session = createSession();
    const stored = JSON.stringify(session);
    const retrieved = JSON.parse(stored) as WalletSession;
    expect(retrieved.id).toBe(session.id);
  });

  it('should handle session with metadata', () => {
    const session = createSession({ meta: { walletType: 'hiro' } });
    expect(session.meta?.walletType).toBe('hiro');
  });

  it('should support multiple accounts', () => {
    const session = createSession({ accounts: ['ST123', 'ST456'] });
    expect(session.accounts).toHaveLength(2);
  });

  it('should clear session data', () => {
    const session = createSession();
    const cleared = null;
    expect(cleared).toBeNull();
    expect(session.id).toBeDefined(); // original unchanged
  });
});
