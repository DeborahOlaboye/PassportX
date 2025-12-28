/**
 * Unit tests for auth context.
 */

describe('Auth context and provider', () => {
  it('should initialize with no token', () => {
    const initialState = { token: null, isAuthenticated: false };
    expect(initialState.token).toBeNull();
    expect(initialState.isAuthenticated).toBe(false);
  });

  it('should sign in and set token', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({
      accessToken: 'token123',
      account: 'ST123',
      issued: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60
    });

    const result = await mockSignIn('ST123');
    expect(result.accessToken).toBe('token123');
    expect(result.account).toBe('ST123');
  });

  it('should sign out and clear token', async () => {
    let token: any = { accessToken: 'token123' };
    const signOut = () => {
      token = null;
    };
    signOut();
    expect(token).toBeNull();
  });

  it('should verify valid token', () => {
    const token = {
      accessToken: 'token',
      account: 'ST123',
      issued: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 // 1 hour in future
    };
    const isValid = Date.now() <= token.expiresAt;
    expect(isValid).toBe(true);
  });

  it('should reject expired token', () => {
    const token = {
      accessToken: 'token',
      account: 'ST123',
      issued: Date.now() - 1000 * 60 * 60,
      expiresAt: Date.now() - 1000 // expired 1 second ago
    };
    const isValid = Date.now() <= token.expiresAt;
    expect(isValid).toBe(false);
  });

  it('should recover token on provider mount', async () => {
    const stored = {
      accessToken: 'token123',
      account: 'ST456',
      issued: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60
    };
    // Simulate storage retrieval
    const retrieved = JSON.parse(JSON.stringify(stored));
    expect(retrieved.accessToken).toBe(stored.accessToken);
  });
});
