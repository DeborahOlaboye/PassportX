import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Can mint badge with proper permissions",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        
        const block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-badge', [
                types.principal(user1.address),
                types.uint(1)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result.expectOk(), types.uint(1));
    },
});

Clarinet.test({
    name: "Non-transferable NFT prevents transfers",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;

        const block = chain.mineBlock([
            Tx.contractCall('passport-nft', 'transfer', [
                types.uint(1),
                types.principal(user1.address),
                types.principal(user2.address)
            ], user1.address)
        ]);

        assertEquals(block.receipts[0].result.expectErr(), types.uint(103));
    },
});

Clarinet.test({
    name: "Can mint multiple badges in bulk",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;
        const user3 = accounts.get('wallet_3')!;

        const block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-multiple-badges', [
                types.list([
                    types.tuple({
                        'recipient': types.principal(user1.address),
                        'template-id': types.uint(1)
                    }),
                    types.tuple({
                        'recipient': types.principal(user2.address),
                        'template-id': types.uint(1)
                    }),
                    types.tuple({
                        'recipient': types.principal(user3.address),
                        'template-id': types.uint(1)
                    })
                ])
            ], deployer.address)
        ]);

        assertEquals(block.receipts.length, 1);
        const result = block.receipts[0].result.expectOk();
        assertEquals(result, types.list([
            types.uint(1),
            types.uint(2),
            types.uint(3)
        ]));
    },
});

Clarinet.test({
    name: "Bulk minting with mixed valid/invalid templates",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;

        const block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-multiple-badges', [
                types.list([
                    types.tuple({
                        'recipient': types.principal(user1.address),
                        'template-id': types.uint(1)  // valid
                    }),
                    types.tuple({
                        'recipient': types.principal(user2.address),
                        'template-id': types.uint(999)  // invalid
                    })
                ])
            ], deployer.address)
        ]);

        // Should fail due to invalid template
        assertEquals(block.receipts[0].result.expectErr(), types.uint(105));
    },
});

Clarinet.test({
    name: "Unauthorized user cannot bulk mint badges",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;

        const block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-multiple-badges', [
                types.list([
                    types.tuple({
                        'recipient': types.principal(user1.address),
                        'template-id': types.uint(1)
                    })
                ])
            ], user2.address)
        ]);

        assertEquals(block.receipts[0].result.expectErr(), types.uint(104));
    },
});

Clarinet.test({
    name: "Can revoke multiple badges in bulk",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;

        // First mint some badges
        let block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-badge', [
                types.principal(user1.address),
                types.uint(1)
            ], deployer.address),
            Tx.contractCall('badge-issuer', 'mint-badge', [
                types.principal(user2.address),
                types.uint(1)
            ], deployer.address)
        ]);

        // Now revoke them in bulk
        block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'revoke-multiple-badges', [
                types.list([types.uint(1), types.uint(2)])
            ], deployer.address)
        ]);

        assertEquals(block.receipts.length, 1);
        const result = block.receipts[0].result.expectOk();
        assertEquals(result, types.list([
            types.ok(types.bool(true)),
            types.ok(types.bool(true))
        ]));
    },
});

Clarinet.test({
    name: "Bulk revocation with mixed valid/invalid badge IDs",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;

        // First mint one badge
        let block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-badge', [
                types.principal(deployer.address),
                types.uint(1)
            ], deployer.address)
        ]);

        // Try to revoke valid and invalid badge IDs
        block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'revoke-multiple-badges', [
                types.list([types.uint(1), types.uint(999)])
            ], deployer.address)
        ]);

        // Should fail due to invalid badge ID
        assertEquals(block.receipts[0].result.expectErr(), types.uint(105));
    },
});

Clarinet.test({
    name: "Unauthorized user cannot bulk revoke badges",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;

        // Mint a badge as deployer
        let block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-badge', [
                types.principal(user1.address),
                types.uint(1)
            ], deployer.address)
        ]);

        // Try to revoke as unauthorized user
        block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'revoke-multiple-badges', [
                types.list([types.uint(1)])
            ], user2.address)
        ]);

        assertEquals(block.receipts[0].result.expectErr(), types.uint(104));
    },
});

Clarinet.test({
    name: "Bulk operations handle empty lists gracefully",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;

        const block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-multiple-badges', [
                types.list([])
            ], deployer.address)
        ]);

        assertEquals(block.receipts[0].result.expectOk(), types.list([]));
    },
});

Clarinet.test({
    name: "Bulk minting preserves badge ID sequence",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;

        // Mint single badge first
        let block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-badge', [
                types.principal(user1.address),
                types.uint(1)
            ], deployer.address)
        ]);
        assertEquals(block.receipts[0].result.expectOk(), types.uint(1));

        // Bulk mint two more
        block = chain.mineBlock([
            Tx.contractCall('badge-issuer', 'mint-multiple-badges', [
                types.list([
                    types.tuple({
                        'recipient': types.principal(user2.address),
                        'template-id': types.uint(1)
                    }),
                    types.tuple({
                        'recipient': types.principal(user1.address),
                        'template-id': types.uint(1)
                    })
                ])
            ], deployer.address)
        ]);

        const result = block.receipts[0].result.expectOk();
        assertEquals(result, types.list([
            types.uint(2),
            types.uint(3)
        ]));
    },
});
