import { saveSession, loadSession, clearSession, recoverSession, isExpired } from '../../src/utils/walletSession';

const TEST_SESSION = {
  id: 's1',
  accounts: ['acct1'],
  connectedAt: Date.now(),
  expiresAt: Date.now() + 1000 * 60 * 60, // 1h
};

describe('walletSession persistence', () => {
  beforeEach(() => {
    clearSession();
  });

  it('saves and loads a session', async () => {
    await saveSession(TEST_SESSION as any);
    const loaded = await loadSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(TEST_SESSION.id);
  });

  it('recovers session across reloads', async () => {
    await saveSession(TEST_SESSION as any);
    const recovered = await recoverSession();
    expect(recovered).not.toBeNull();
    expect(recovered?.accounts[0]).toBe('acct1');
  });

  it('clears session and handles expiration', async () => {
    const short = { ...TEST_SESSION, expiresAt: Date.now() - 1000 };
    await saveSession(short as any);
    const recovered = await recoverSession();
    expect(recovered).toBeNull();
    expect(isExpired(short as any)).toBe(true);
  });
});
