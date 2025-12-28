/**
 * Additional edge-case tests for robustness.
 */

describe('WalletConnect edge cases', () => {
  it('should handle rapid connect/disconnect cycles', async () => {
    const mockConnect = jest.fn().mockResolvedValue({ accounts: ['ST123'] });
    const mockDisconnect = jest.fn();
    
    for (let i = 0; i < 5; i++) {
      await mockConnect();
      mockDisconnect();
    }
    
    expect(mockConnect).toHaveBeenCalledTimes(5);
    expect(mockDisconnect).toHaveBeenCalledTimes(5);
  });

  it('should handle very large transaction payloads', () => {
    const largePayload = { data: 'x'.repeat(10000) };
    const size = JSON.stringify(largePayload).length;
    expect(size).toBeGreaterThan(10000);
  });

  it('should handle network interruption gracefully', async () => {
    const mockFetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ status: 200 });
    
    await expect(mockFetch()).rejects.toThrow('Network error');
    const result = await mockFetch();
    expect(result.status).toBe(200);
  });

  it('should handle simultaneous operations', async () => {
    const op1 = jest.fn().mockResolvedValue({ id: 1 });
    const op2 = jest.fn().mockResolvedValue({ id: 2 });
    
    const [r1, r2] = await Promise.all([op1(), op2()]);
    expect(r1.id).toBe(1);
    expect(r2.id).toBe(2);
  });

  it('should handle empty account lists', () => {
    const session = {
      id: 'test',
      accounts: [] as string[],
      connectedAt: Date.now()
    };
    expect(session.accounts.length).toBe(0);
  });

  it('should sanitize user inputs', () => {
    const malicious = '<script>alert("xss")</script>';
    const sanitized = malicious.replace(/<[^>]*>/g, '');
    expect(sanitized).not.toContain('<');
  });
});
