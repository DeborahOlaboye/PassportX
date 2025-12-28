import { isTestnetConfigured, connectWallet, signAndSubmit } from './helpers/walletConnectHelper';

describe('Multi-contract interactions via WalletConnect (placeholder)', () => {
  it('skips when not configured', async () => {
    if (!isTestnetConfigured()) return;
    const session = await connectWallet();
    const res1 = await signAndSubmit({ action: 'issue-badge' });
    const res2 = await signAndSubmit({ action: 'update-community' });
    expect(res1.txId).toBeDefined();
    expect(res2.txId).toBeDefined();
  });
});
