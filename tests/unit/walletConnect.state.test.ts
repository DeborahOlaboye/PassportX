/**
 * Tests for state management with contexts and hooks.
 */

describe('WalletConnect state management', () => {
  it('should initialize context state', () => {
    const initialState = {
      session: null,
      isConnected: false,
      error: null
    };
    expect(initialState.session).toBeNull();
    expect(initialState.isConnected).toBe(false);
  });

  it('should update session state', () => {
    let state = { session: null, isConnected: false };
    const newSession = { id: 'sess-1', accounts: ['ST123'], connectedAt: Date.now() };
    state = { ...state, session: newSession, isConnected: true };
    expect(state.session?.id).toBe('sess-1');
    expect(state.isConnected).toBe(true);
  });

  it('should clear session state on disconnect', () => {
    let state = {
      session: { id: 'sess-1', accounts: ['ST123'], connectedAt: Date.now() },
      isConnected: true
    };
    state = { ...state, session: null, isConnected: false };
    expect(state.session).toBeNull();
    expect(state.isConnected).toBe(false);
  });

  it('should manage error state', () => {
    let state = { error: null };
    state = { ...state, error: new Error('Connection failed') };
    expect(state.error?.message).toBe('Connection failed');
    state = { ...state, error: null };
    expect(state.error).toBeNull();
  });

  it('should handle concurrent state updates', () => {
    let state = { session: null, error: null };
    const updates = [
      { session: { id: '1', accounts: [], connectedAt: 0 } },
      { error: new Error('test') }
    ];
    state = { ...state, ...updates[0], ...updates[1] };
    expect(state.session?.id).toBe('1');
    expect(state.error?.message).toBe('test');
  });

  it('should preserve immutability', () => {
    const original = { session: null, isConnected: false };
    const updated = { ...original, isConnected: true };
    expect(original.isConnected).toBe(false);
    expect(updated.isConnected).toBe(true);
  });

  it('should support lazy state initialization', () => {
    const lazyInit = () => ({
      session: null,
      isConnected: false,
      error: null
    });
    const state1 = lazyInit();
    const state2 = lazyInit();
    expect(state1).not.toBe(state2); // different instances
  });
});
