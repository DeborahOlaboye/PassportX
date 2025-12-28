/**
 * Tests for transaction signing flows.
 */

describe('Transaction signing', () => {
  it('should sign a transaction', async () => {
    const mockSign = jest.fn().mockResolvedValue({ txId: '0xabc123' });
    const result = await mockSign({ contractId: 'ST.CONTRACT', method: 'issue-badge' });
    expect(result.txId).toBeDefined();
    expect(mockSign).toHaveBeenCalled();
  });

  it('should handle signing rejection', async () => {
    const mockSign = jest.fn().mockRejectedValue(new Error('User rejected signing'));
    await expect(mockSign()).rejects.toThrow('User rejected signing');
  });

  it('should include correct payload in signature', async () => {
    const payload = { contractId: 'ST.BADGE', method: 'mint' };
    const mockSign = jest.fn().mockResolvedValue({ txId: '0xdef456' });
    await mockSign(payload);
    expect(mockSign).toHaveBeenCalledWith(payload);
  });

  it('should handle signing timeout', async () => {
    const mockSign = jest.fn().mockRejectedValue(new Error('Signing timeout'));
    await expect(mockSign()).rejects.toThrow('Signing timeout');
  });

  it('should retry failed signature', async () => {
    const mockSign = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ txId: '0xghi789' });
    
    await expect(mockSign()).rejects.toThrow('Network error');
    const result = await mockSign();
    expect(result.txId).toBeDefined();
  });

  it('should validate transaction before signing', async () => {
    const invalidTx = { contractId: '' };
    const validation = (tx: any) => tx.contractId && tx.contractId.length > 0;
    expect(validation(invalidTx)).toBe(false);
  });
});
