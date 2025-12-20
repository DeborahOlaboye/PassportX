import Community from '../models/Community';
import User from '../models/User';
import { ICommunity } from '../types';

export interface CommunityCreationEvent {
  communityId: string;
  communityName: string;
  description: string;
  ownerAddress: string;
  createdAtBlockHeight: number;
  contractAddress: string;
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
}

export interface CommunityCreationResult {
  success: boolean;
  communityId?: string;
  message: string;
  error?: string;
}

export class CommunityCreationService {
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[CommunityCreationService] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CommunityCreationService] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CommunityCreationService] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CommunityCreationService] ${msg}`, ...args)
    };
  }

  async processCommunityCreationEvent(event: CommunityCreationEvent): Promise<CommunityCreationResult> {
    try {
      this.logger.debug('Processing community creation event', {
        communityId: event.communityId,
        communityName: event.communityName,
        ownerAddress: event.ownerAddress,
        transactionHash: event.transactionHash
      });

      // Validate event data
      const validation = this.validateCommunityEvent(event);
      if (!validation.valid) {
        this.logger.warn('Invalid community creation event', { errors: validation.errors });
        return {
          success: false,
          message: 'Invalid community creation event: ' + validation.errors.join(', '),
          error: 'Validation failed'
        };
      }

      // Check if community already exists by blockchain ID
      const existingByBlockchain = await Community.findOne({
        'metadata.blockchainId': event.communityId,
        'metadata.contractAddress': event.contractAddress
      });

      if (existingByBlockchain) {
        this.logger.warn('Community already exists in database', {
          communityId: event.communityId,
          dbId: existingByBlockchain._id
        });
        return {
          success: true,
          communityId: existingByBlockchain._id?.toString(),
          message: 'Community already exists'
        };
      }

      // Check if community name is already taken
      const slug = this.generateSlug(event.communityName);
      const existingBySlug = await Community.findOne({ slug });

      if (existingBySlug) {
        this.logger.warn('Community with this name already exists', {
          name: event.communityName,
          slug
        });
        return {
          success: false,
          message: 'A community with this name already exists',
          error: 'Duplicate community name'
        };
      }

      // Ensure owner user exists
      let ownerUser = await User.findOne({ stacksAddress: event.ownerAddress });

      if (!ownerUser) {
        ownerUser = await User.create({
          stacksAddress: event.ownerAddress,
          email: '',
          communities: [],
          adminCommunities: [],
          notifications: [],
          createdAt: new Date(),
          updatedAt: new Date()
        });

        this.logger.info('Created new user from community creation event', {
          stacksAddress: event.ownerAddress,
          userId: ownerUser._id
        });
      }

      // Create community
      const communityData: Partial<ICommunity> = {
        name: event.communityName,
        slug,
        description: event.description || '',
        admins: [event.ownerAddress],
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#10b981',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          borderRadius: '0.5rem'
        },
        settings: {
          allowMemberInvites: true,
          requireApproval: false,
          allowBadgeIssuance: true,
          allowCustomBadges: false
        },
        socialLinks: {},
        tags: [],
        memberCount: 1,
        isPublic: true,
        isActive: true,
        metadata: {
          blockchainId: event.communityId,
          contractAddress: event.contractAddress,
          createdAtBlockHeight: event.createdAtBlockHeight,
          createdAtTransactionHash: event.transactionHash,
          createdAtTimestamp: new Date(event.timestamp)
        }
      };

      const community = await Community.create(communityData);

      this.logger.info('Community created from blockchain event', {
        communityId: community._id,
        blockchainId: event.communityId,
        name: event.communityName,
        owner: event.ownerAddress
      });

      // Update user to include this community
      await User.findByIdAndUpdate(
        ownerUser._id,
        {
          $addToSet: {
            communities: community._id,
            adminCommunities: community._id
          }
        },
        { new: true }
      );

      return {
        success: true,
        communityId: community._id?.toString(),
        message: `Community "${event.communityName}" created successfully`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to process community creation event', error);

      return {
        success: false,
        message: 'Failed to process community creation event',
        error: errorMessage
      };
    }
  }

  async syncCommunityFromBlockchain(
    blockchainId: string,
    contractAddress: string,
    ownerAddress: string,
    communityName: string,
    description: string
  ): Promise<CommunityCreationResult> {
    try {
      const event: CommunityCreationEvent = {
        communityId: blockchainId,
        communityName,
        description,
        ownerAddress,
        createdAtBlockHeight: 0,
        contractAddress,
        transactionHash: '',
        blockHeight: 0,
        timestamp: Date.now()
      };

      return await this.processCommunityCreationEvent(event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to sync community from blockchain', error);

      return {
        success: false,
        message: 'Failed to sync community from blockchain',
        error: errorMessage
      };
    }
  }

  async getCommunityByBlockchainId(
    blockchainId: string,
    contractAddress: string
  ): Promise<any | null> {
    try {
      return await Community.findOne({
        'metadata.blockchainId': blockchainId,
        'metadata.contractAddress': contractAddress
      });
    } catch (error) {
      this.logger.error('Failed to get community by blockchain ID', error);
      return null;
    }
  }

  async updateCommunityMetadata(
    communityId: string,
    metadata: Record<string, any>
  ): Promise<boolean> {
    try {
      const result = await Community.findByIdAndUpdate(
        communityId,
        { $set: { metadata } },
        { new: true }
      );

      if (result) {
        this.logger.info('Community metadata updated', {
          communityId,
          metadata
        });
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to update community metadata', error);
      return false;
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private validateCommunityEvent(event: CommunityCreationEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event) {
      errors.push('Event is null or undefined');
      return { valid: false, errors };
    }

    if (!event.communityName || typeof event.communityName !== 'string' || event.communityName.trim().length === 0) {
      errors.push('Community name is required and must be a non-empty string');
    }

    if (!event.ownerAddress || typeof event.ownerAddress !== 'string' || event.ownerAddress.trim().length === 0) {
      errors.push('Owner address is required and must be a non-empty string');
    }

    if (!event.contractAddress || typeof event.contractAddress !== 'string' || event.contractAddress.trim().length === 0) {
      errors.push('Contract address is required and must be a non-empty string');
    }

    if (!event.transactionHash || typeof event.transactionHash !== 'string' || event.transactionHash.trim().length === 0) {
      errors.push('Transaction hash is required and must be a non-empty string');
    }

    if (event.communityName && event.communityName.length > 64) {
      errors.push('Community name must be 64 characters or less');
    }

    if (event.description && event.description.length > 256) {
      errors.push('Description must be 256 characters or less');
    }

    if (typeof event.blockHeight !== 'number' || event.blockHeight < 0) {
      errors.push('Block height must be a non-negative number');
    }

    if (typeof event.timestamp !== 'number' || event.timestamp < 0) {
      errors.push('Timestamp must be a non-negative number');
    }

    return { valid: errors.length === 0, errors };
  }

  private validateCommunityName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Community name cannot be empty' };
    }

    if (name.length < 3) {
      return { valid: false, error: 'Community name must be at least 3 characters' };
    }

    if (name.length > 64) {
      return { valid: false, error: 'Community name cannot exceed 64 characters' };
    }

    if (!/^[a-zA-Z0-9\s\-_&.]{3,64}$/.test(name)) {
      return { valid: false, error: 'Community name contains invalid characters' };
    }

    return { valid: true };
  }

  private validateStacksAddress(address: string): { valid: boolean; error?: string } {
    if (!address || typeof address !== 'string') {
      return { valid: false, error: 'Address must be a non-empty string' };
    }

    if (!address.startsWith('SP') && !address.startsWith('ST')) {
      return { valid: false, error: 'Invalid Stacks address format' };
    }

    if (address.length < 30 || address.length > 42) {
      return { valid: false, error: 'Stacks address has invalid length' };
    }

    return { valid: true };
  }
}

export default CommunityCreationService;
