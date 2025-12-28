export const getTestnetUrl = () => process.env.WC_TESTNET_URL || null;

export const assertTestnet = () => {
  const url = getTestnetUrl();
  if (!url) throw new Error('WC_TESTNET_URL not set');
  return url;
};

export default { getTestnetUrl, assertTestnet };
