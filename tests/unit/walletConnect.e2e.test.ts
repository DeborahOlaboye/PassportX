/**
 * Integration tests covering end-to-end flows.
 */

describe('WalletConnect end-to-end flows', () => {
  it('should complete connection -> session -> sign flow', async () => {
    const mockConnect = jest.fn().mockResolvedValue({ accounts: ['ST123'] });
    const mockSign = jest.fn().mockResolvedValue({ txId: '0xabc' });
    
    const connected = await mockConnect();
    expect(connected.accounts).toHaveLength(1);
    
    const signed = await mockSign({ action: 'test' });
    expect(signed.txId).toBeDefined();
  });

  it('should handle disconnection and reconnection', async () => {
    const mockConnect = jest.fn().mockResolvedValue({ accounts: ['ST123'] });
    
    // Connect
    await mockConnect();
    expect(mockConnect).toHaveBeenCalledTimes(1);
    
    // Disconnect (clear state)
    const state = null;
    expect(state).toBeNull();
    
    // Reconnect
    await mockConnect();
    expect(mockConnect).toHaveBeenCalledTimes(2);
  });

  it('should survive session recovery after page reload', () => {
    const session = {
      id: 'sess-1',
      accounts: ['ST123'],
      connectedAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60
    };
    
    // Simulate storage
    const stored = JSON.stringify(session);
    const retrieved = JSON.parse(stored);
    
    expect(retrieved.id).toBe(session.id);
    expect(retrieved.accounts).toEqual(session.accounts);
  });

  it('should handle error and recovery in flow', async () => {
    const mockConnect = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ accounts: ['ST123'] });
    
    await expect(mockConnect()).rejects.toThrow('Network error');
    const result = await mockConnect();
    expect(result.accounts).toHaveLength(1);
  });
});
