import retry from '../../src/utils/retry';

describe('retry util', () => {
  it('retries failing function and eventually succeeds', async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 2) throw new Error('fail');
      return 'ok';
    };
    const res = await retry(fn, { retries: 3, delayMs: 10 });
    expect(res).toBe('ok');
    expect(calls).toBe(2);
  });

  it('throws after retries exhausted', async () => {
    const fn = async () => {
      throw new Error('always fail');
    };
    await expect(retry(fn, { retries: 2, delayMs: 1 })).rejects.toThrow('always fail');
  });
});
