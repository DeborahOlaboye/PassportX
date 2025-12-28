import { isTestnetConfigured, connectWallet, signAndSubmit } from './helpers/walletConnectHelper';

describe('Community creation via WalletConnect (placeholder)', () => {
  it('skips when not configured', async () => {
    if (!isTestnetConfigured()) return;
    const session = await connectWallet();
    expect(session.accounts[0]).toBeDefined();
    const res = await signAndSubmit({ action: 'create-community', payload: { name: 'Test Community' } });
    expect(res.txId).toBeDefined();
  });
});
