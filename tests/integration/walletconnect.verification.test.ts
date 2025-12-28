import { isTestnetConfigured, signAndSubmit } from './helpers/walletConnectHelper';

describe('Badge verification on-chain (placeholder)', () => {
  it('skips when not configured', async () => {
    if (!isTestnetConfigured()) return;
    const res = await signAndSubmit({ action: 'verify-badge', badgeId: 1 });
    expect(res.txId).toBeDefined();
  });
});
