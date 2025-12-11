import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "NFT minting works correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('passport-nft', 'mint', [
                types.principal(user1.address)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), types.uint(1));
    },
});

Clarinet.test({
    name: "Transfer is disabled for non-transferable NFTs",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;
        
        // First mint an NFT
        let mintBlock = chain.mineBlock([
            Tx.contractCall('passport-nft', 'mint', [
                types.principal(user1.address)
            ], deployer.address)
        ]);
        
        // Try to transfer - should fail
        let transferBlock = chain.mineBlock([
            Tx.contractCall('passport-nft', 'transfer', [
                types.uint(1),
                types.principal(user1.address),
                types.principal(user2.address)
            ], user1.address)
        ]);
        
        assertEquals(transferBlock.receipts[0].result.expectErr(), types.uint(103));
    },
});

Clarinet.test({
    name: "Only owner can mint NFTs",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const user1 = accounts.get('wallet_1')!;
        const user2 = accounts.get('wallet_2')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('passport-nft', 'mint', [
                types.principal(user2.address)
            ], user1.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(100));
    },
});