import { Predicate } from '../services/chainhookPredicateManager';
import { getContracts } from './contracts';

export interface PredicateConfig {
  communityCreation: Predicate;
  communityCreationEvent?: Predicate;
  [key: string]: Predicate | undefined;
}

export interface ChainhookPredicateSpec {
  uuid: string;
  name: string;
  description: string;
  type: 'stacks-contract-call' | 'stacks-block' | 'stacks-print';
  network: 'mainnet' | 'testnet' | 'devnet';
  if_this: {
    scope: string;
    contract_identifier?: string;
    method?: string;
    print_event_type?: string;
  };
  then_that: {
    http_post: {
      url: string;
      authorization_header: string;
    };
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function getCommunityManagerContractId(): string {
  const contracts = getContracts();
  return `${contracts.communityManager.address}.${contracts.communityManager.name}`;
}

function buildCommunityCreationPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  const contractId = getCommunityManagerContractId();
  const webhookUrl = process.env.CHAINHOOK_WEBHOOK_URL || 'http://localhost:3010/api/community-creation/webhook/events';
  const authToken = process.env.CHAINHOOK_AUTH_TOKEN || '';

  return {
    uuid: 'pred_community_creation_call',
    name: 'Community Creation - Contract Call',
    type: 'stacks-contract-call',
    network,
    if_this: {
      scope: 'contract',
      contract_identifier: contractId,
      method: 'create-community'
    },
    then_that: {
      http_post: {
        url: webhookUrl,
        authorization_header: authToken
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function buildCommunityCreationEventPredicate(network: 'mainnet' | 'testnet' | 'devnet'): Predicate {
  const contractId = getCommunityManagerContractId();
  const webhookUrl = process.env.CHAINHOOK_WEBHOOK_URL || 'http://localhost:3010/api/community-creation/webhook/events';
  const authToken = process.env.CHAINHOOK_AUTH_TOKEN || '';

  return {
    uuid: 'pred_community_creation_event',
    name: 'Community Creation - Contract Event',
    type: 'stacks-print',
    network,
    if_this: {
      scope: 'contract',
      contract_identifier: contractId,
      print_event_type: 'community-created'
    },
    then_that: {
      http_post: {
        url: webhookUrl,
        authorization_header: authToken
      }
    },
    active: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function getPredicateConfigs(enableEventPredicate: boolean = false): PredicateConfig {
  const network = (process.env.STACKS_NETWORK || 'devnet') as 'mainnet' | 'testnet' | 'devnet';

  const config: PredicateConfig = {
    communityCreation: buildCommunityCreationPredicate(network)
  };

  if (enableEventPredicate || process.env.CHAINHOOK_ENABLE_EVENT_PREDICATE === 'true') {
    config.communityCreationEvent = buildCommunityCreationEventPredicate(network);
  }

  return config;
}

export function getPredicateByName(name: string): Predicate | null {
  const configs = getPredicateConfigs(true);

  for (const [key, predicate] of Object.entries(configs)) {
    if (predicate && predicate.name === name) {
      return predicate;
    }
  }

  return null;
}

export function getPredicateByUuid(uuid: string): Predicate | null {
  const configs = getPredicateConfigs(true);

  for (const [key, predicate] of Object.entries(configs)) {
    if (predicate && predicate.uuid === uuid) {
      return predicate;
    }
  }

  return null;
}

export function getAllPredicates(includeInactive: boolean = false): Predicate[] {
  const configs = getPredicateConfigs(true);
  const predicates = Object.values(configs).filter((p): p is Predicate => p !== undefined);

  if (!includeInactive) {
    return predicates.filter(p => p.active !== false);
  }

  return predicates;
}

export function validatePredicateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const predicates = getAllPredicates(true);

    if (predicates.length === 0) {
      errors.push('No predicates configured');
      return { valid: false, errors };
    }

    for (const predicate of predicates) {
      if (!predicate.uuid || !predicate.name) {
        errors.push(`Invalid predicate configuration: missing uuid or name`);
      }

      if (!['stacks-contract-call', 'stacks-block', 'stacks-print'].includes(predicate.type)) {
        errors.push(`Invalid predicate type: ${predicate.type}`);
      }

      if (!predicate.then_that?.http_post?.url) {
        errors.push(`Predicate ${predicate.name} missing webhook URL`);
      }

      if (!predicate.network || !['mainnet', 'testnet', 'devnet'].includes(predicate.network)) {
        errors.push(`Predicate ${predicate.name} has invalid network: ${predicate.network}`);
      }

      if (predicate.type === 'stacks-contract-call' && !predicate.if_this?.contract_identifier) {
        errors.push(`Contract call predicate ${predicate.name} missing contract_identifier`);
      }

      if (predicate.type === 'stacks-contract-call' && !predicate.if_this?.method) {
        errors.push(`Contract call predicate ${predicate.name} missing method`);
      }
    }

    if (errors.length === 0) {
      console.log(`✅ Predicate configuration valid (${predicates.length} predicates)`);
      console.log(`📋 Active predicates: ${predicates.filter(p => p.active).length}`);
      for (const predicate of predicates.filter(p => p.active)) {
        console.log(`   - ${predicate.name} (${predicate.uuid})`);
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Failed to validate predicate configuration: ${errorMessage}`);
    console.error('Failed to validate predicate configuration:', error);
    return { valid: false, errors };
  }
}

export default {
  getPredicateConfigs,
  getPredicateByName,
  getPredicateByUuid,
  getAllPredicates,
  validatePredicateConfig
};
