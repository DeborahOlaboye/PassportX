# WalletConnect Integration Tests

These integration tests are designed to exercise WalletConnect flows against a configured Stacks testnet.

How to run locally:

1. Copy `.env.example.integration` to `.env.integration` and fill the values.
2. Run the tests with:

```bash
WC_ENABLED=1 npm run test:integration:wc
```

Notes:
- Tests are scaffolds/placeholders that will be executed only if `WC_ENABLED=1` and `WC_TESTNET_URL` are set.
- Replace the helper placeholders in `tests/integration/helpers/walletConnectHelper.ts` with a real WalletConnect provider and signing flow for full end-to-end testing.
