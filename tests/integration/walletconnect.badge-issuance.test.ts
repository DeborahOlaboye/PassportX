import { isTestnetConfigured, connectWallet, signAndSubmit } from './helpers/walletConnectHelper';

describe('Badge issuance via WalletConnect (placeholder)', () => {
  it('skips when not configured', async () => {
    if (!isTestnetConfigured()) return;
    const session = await connectWallet();
    expect(session.accounts.length).toBeGreaterThan(0);
    const res = await signAndSubmit({ action: 'issue-badge' });
    expect(res.txId).toBeDefined();
  });
});
