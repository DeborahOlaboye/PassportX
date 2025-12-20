import { Predicate } from '../services/chainhookPredicateManager';
import { getContracts } from './contracts';

export interface PredicateConfig {
  communityCreation: Predicate;
  [key: string]: Predicate;
}

function getCommunityManagerContractId(): string {
  const contracts = getContracts();
  return `${contracts.communityManager.address}.${contracts.communityManager.name}`;
}

function buildCommunityCreationPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  const contractId = getCommunityManagerContractId();

  return {
    uuid: 'pred_community_creation',
    name: 'Community Creation Events',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract',
      contract_identifier: contractId,
      method: 'create-community'
    },
    then_that: {
      http_post: {
        url: process.env.CHAINHOOK_WEBHOOK_URL || 'http://localhost:3010/chainhook/events',
        authorization_header: process.env.CHAINHOOK_AUTH_TOKEN || ''
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function getPredicateConfigs(): PredicateConfig {
  const network = (process.env.STACKS_NETWORK || 'devnet') as 'mainnet' | 'testnet' | 'devnet';

  return {
    communityCreation: buildCommunityCreationPredicate(network)
  };
}

export function getPredicateByName(name: string): Predicate | null {
  const configs = getPredicateConfigs();

  for (const [key, predicate] of Object.entries(configs)) {
    if (predicate && predicate.name === name) {
      return predicate;
    }
  }

  return null;
}

export function getAllPredicates(): Predicate[] {
  const configs = getPredicateConfigs();
  return Object.values(configs).filter((p): p is Predicate => p !== undefined);
}

export function validatePredicateConfig(): boolean {
  try {
    const predicates = getAllPredicates();

    for (const predicate of predicates) {
      if (!predicate.uuid || !predicate.name) {
        console.error(`Invalid predicate configuration: ${JSON.stringify(predicate)}`);
        return false;
      }

      if (!['stacks-contract-call', 'stacks-block', 'stacks-print'].includes(predicate.type)) {
        console.error(`Invalid predicate type: ${predicate.type}`);
        return false;
      }

      if (!predicate.then_that?.http_post?.url) {
        console.error(`Predicate ${predicate.name} missing webhook URL`);
        return false;
      }
    }

    console.log(`✅ Predicate configuration valid (${predicates.length} predicates)`);
    return true;
  } catch (error) {
    console.error('Failed to validate predicate configuration:', error);
    return false;
  }
}

export default {
  getPredicateConfigs,
  getPredicateByName,
  getAllPredicates,
  validatePredicateConfig
};
