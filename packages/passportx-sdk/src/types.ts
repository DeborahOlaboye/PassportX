/**
 * PassportX SDK Type Definitions
 * @module @passportx/sdk
 */

/**
 * Configuration options for the PassportX SDK
 */
export interface PassportXConfig {
  /**
   * Base URL for the PassportX API
   * @default "https://api.passportx.app"
   */
  apiUrl?: string;

  /**
   * Stacks network to use
   * @default "mainnet"
   */
  network?: 'mainnet' | 'testnet' | 'devnet';

  /**
   * Optional API key for authenticated requests
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds
   * @default 10000
   */
  timeout?: number;
}

/**
 * Badge category types
 */
export type BadgeCategory =
  | 'skill'
  | 'participation'
  | 'contribution'
  | 'leadership'
  | 'learning'
  | 'achievement'
  | 'milestone';

/**
 * Badge metadata information
 */
export interface BadgeMetadata {
  /** Badge level (1-5) */
  level: number;

  /** Badge category */
  category: BadgeCategory;

  /** Timestamp when badge was issued */
  timestamp: number;
}

/**
 * Badge template information
 */
export interface BadgeTemplate {
  /** Unique template ID */
  id: string;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Badge category */
  category: BadgeCategory;

  /** Badge level (1-5) */
  level: number;

  /** Icon or emoji representing the badge */
  icon?: string;

  /** Requirements to earn this badge */
  requirements?: string;

  /** Community ID this template belongs to */
  community: string;

  /** Address of template creator */
  creator: string;

  /** Whether template is active */
  isActive: boolean;

  /** Template creation date */
  createdAt: Date;
}

/**
 * Issued badge information
 */
export interface Badge {
  /** Unique badge ID */
  id: string;

  /** Template this badge was issued from */
  templateId: string;

  /** Stacks address of badge owner */
  owner: string;

  /** Stacks address of badge issuer */
  issuer: string;

  /** Community ID */
  community: string;

  /** NFT token ID (if minted on-chain) */
  tokenId?: number;

  /** Stacks transaction ID */
  transactionId?: string;

  /** Date badge was issued */
  issuedAt: Date;

  /** Badge metadata */
  metadata: BadgeMetadata;
}

/**
 * Extended badge with template information
 */
export interface BadgeWithTemplate extends Badge {
  /** Template details */
  template: BadgeTemplate;
}

/**
 * Community theme configuration
 */
export interface CommunityTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  logo?: {
    url: string;
    width?: number;
    height?: number;
  };
  bannerImage?: {
    url: string;
    width?: number;
    height?: number;
  };
}

/**
 * Community information
 */
export interface Community {
  /** Unique community ID */
  id: string;

  /** Community name */
  name: string;

  /** URL-friendly slug */
  slug: string;

  /** Community description */
  description: string;

  /** Extended about information */
  about?: string;

  /** Community website */
  website?: string;

  /** Community admin addresses */
  admins: string[];

  /** Theme configuration */
  theme: CommunityTheme;

  /** Social media links */
  socialLinks?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    github?: string;
    linkedin?: string;
  };

  /** Number of community members */
  memberCount: number;

  /** Array of badge template IDs */
  badgeTemplates: string[];

  /** Whether community is public */
  isPublic: boolean;

  /** Whether community is active */
  isActive: boolean;

  /** Community tags */
  tags: string[];

  /** Creation date */
  createdAt: Date;

  /** Last update date */
  updatedAt: Date;
}

/**
 * Pagination information
 */
export interface Pagination {
  /** Total number of items */
  total: number;

  /** Number of items per page */
  limit: number;

  /** Offset from start */
  offset: number;

  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Response data */
  data: T[];

  /** Pagination information */
  pagination: Pagination;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  /** Whether request was successful */
  success: boolean;

  /** Response data */
  data?: T;

  /** Error message if failed */
  message?: string;
}

/**
 * Query options for filtering results
 */
export interface QueryOptions {
  /** Number of items to return */
  limit?: number;

  /** Offset from start */
  offset?: number;

  /** Sort field */
  sortBy?: string;

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Badge query filters
 */
export interface BadgeQueryOptions extends QueryOptions {
  /** Filter by category */
  category?: BadgeCategory;

  /** Filter by level */
  level?: number;

  /** Filter by community ID */
  communityId?: string;
}

/**
 * SDK Error class
 */
export class PassportXError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'PassportXError';
    Object.setPrototypeOf(this, PassportXError.prototype);
  }
}
