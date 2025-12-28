/**
 * Helper utilities for WalletConnect integration tests.
 * This module intentionally provides lightweight stubs that can be
 * replaced with real WalletConnect interactions when credentials are available.
 */

export const isTestnetConfigured = () => {
  return !!process.env.WC_TESTNET_URL && !!process.env.WC_ENABLED;
};

export const connectWallet = async (uri?: string) => {
  if (!isTestnetConfigured()) throw new Error('Testnet not configured');
  // Placeholder: In real tests this would open a WalletConnect session.
  return { accounts: ['ST_TEST_ACCOUNT'], uri: uri ?? 'wc://stub' };
};

export const signAndSubmit = async (txPayload: any) => {
  if (!isTestnetConfigured()) throw new Error('Testnet not configured');
  // Placeholder for signing flow. Return a fake tx id.
  return { txId: '0xdeadbeef' };
};

export default { isTestnetConfigured, connectWallet, signAndSubmit };
