import { isTestnetConfigured, connectWallet, signAndSubmit } from './helpers/walletConnectHelper';
import { assertTestnet } from './helpers/networkHelper';

describe('WalletConnect full flow (placeholder)', () => {
  it('runs full end-to-end flow when enabled', async () => {
    if (!isTestnetConfigured()) return;
    const url = assertTestnet();
    expect(url).toBeDefined();
    const session = await connectWallet();
    const issue = await signAndSubmit({ action: 'issue-badge' });
    expect(issue.txId).toBeDefined();
    const verify = await signAndSubmit({ action: 'verify-badge' });
    expect(verify.txId).toBeDefined();
  });
});
