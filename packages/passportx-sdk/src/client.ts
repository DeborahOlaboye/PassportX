/**
 * PassportX SDK Client
 * @module @passportx/sdk
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  PassportXConfig,
  Badge,
  BadgeWithTemplate,
  BadgeTemplate,
  Community,
  PaginatedResponse,
  ApiResponse,
  BadgeQueryOptions,
  QueryOptions,
  PassportXError,
} from './types';

/**
 * Main PassportX SDK Client
 *
 * @example
 * ```typescript
 * import { PassportX } from '@passportx/sdk';
 *
 * const client = new PassportX({
 *   apiUrl: 'https://api.passportx.app',
 *   network: 'mainnet'
 * });
 *
 * // Get user badges
 * const badges = await client.getUserBadges('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
 * ```
 */
export class PassportX {
  private client: AxiosInstance;
  private config: Required<PassportXConfig>;

  /**
   * Create a new PassportX SDK instance
   *
   * @param config - Configuration options
   */
  constructor(config: PassportXConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'https://api.passportx.app',
      network: config.network || 'mainnet',
      apiKey: config.apiKey || '',
      timeout: config.timeout || 10000,
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        throw this.handleError(error);
      }
    );
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): PassportXError {
    if (error.response) {
      const data = error.response.data as any;
      return new PassportXError(
        data.message || 'API request failed',
        data.code,
        error.response.status,
        data
      );
    } else if (error.request) {
      return new PassportXError(
        'No response from server',
        'NO_RESPONSE',
        undefined,
        error.request
      );
    } else {
      return new PassportXError(error.message, 'REQUEST_ERROR');
    }
  }

  /**
   * Get all badges for a specific user
   *
   * @param address - Stacks address of the user
   * @param options - Query options for filtering and pagination
   * @returns Array of badges owned by the user
   *
   * @example
   * ```typescript
   * const badges = await client.getUserBadges(
   *   'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
   *   { limit: 10, category: 'achievement' }
   * );
   * ```
   */
  async getUserBadges(
    address: string,
    options: BadgeQueryOptions = {}
  ): Promise<BadgeWithTemplate[]> {
    const params = new URLSearchParams();

    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.category) params.append('category', options.category);
    if (options.level) params.append('level', options.level.toString());
    if (options.communityId) params.append('communityId', options.communityId);

    const response = await this.client.get<BadgeWithTemplate[]>(
      `/api/users/${address}/badges?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Get detailed information about a specific badge
   *
   * @param badgeId - Unique badge ID
   * @returns Badge information with template details
   *
   * @example
   * ```typescript
   * const badge = await client.getBadge('badge_id_123');
   * console.log(badge.template.name);
   * ```
   */
  async getBadge(badgeId: string): Promise<BadgeWithTemplate> {
    const response = await this.client.get<BadgeWithTemplate>(
      `/api/badges/${badgeId}`
    );
    return response.data;
  }

  /**
   * Get metadata for a specific badge
   *
   * @param badgeId - Unique badge ID
   * @returns Badge metadata including level, category, and timestamp
   *
   * @example
   * ```typescript
   * const metadata = await client.getBadgeMetadata('badge_id_123');
   * console.log(`Level ${metadata.level} ${metadata.category} badge`);
   * ```
   */
  async getBadgeMetadata(badgeId: string) {
    const badge = await this.getBadge(badgeId);
    return badge.metadata;
  }

  /**
   * Get information about a community
   *
   * @param idOrSlug - Community ID or slug
   * @returns Community information
   *
   * @example
   * ```typescript
   * const community = await client.getCommunity('passportx-community');
   * console.log(community.name);
   * ```
   */
  async getCommunity(idOrSlug: string): Promise<Community> {
    const response = await this.client.get<ApiResponse<Community>>(
      `/api/communities/${idOrSlug}`
    );
    return response.data.data!;
  }

  /**
   * Get all badge templates for a community
   *
   * @param communityId - Community ID
   * @returns Array of badge templates
   *
   * @example
   * ```typescript
   * const templates = await client.getCommunityBadges('community_id');
   * templates.forEach(t => console.log(t.name));
   * ```
   */
  async getCommunityBadges(communityId: string): Promise<BadgeTemplate[]> {
    const response = await this.client.get<BadgeTemplate[]>(
      `/api/badges/templates/community/${communityId}`
    );
    return response.data;
  }

  /**
   * Get community members
   *
   * @param communityId - Community ID
   * @param options - Query options for pagination
   * @returns Paginated list of community members
   *
   * @example
   * ```typescript
   * const members = await client.getCommunityMembers('community_id', { limit: 20 });
   * ```
   */
  async getCommunityMembers(
    communityId: string,
    options: QueryOptions = {}
  ): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams();

    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const response = await this.client.get<ApiResponse<PaginatedResponse<any>>>(
      `/api/communities/${communityId}/members?${params.toString()}`
    );

    return response.data.data!;
  }

  /**
   * List all public communities
   *
   * @param options - Query options for filtering and pagination
   * @returns Paginated list of communities
   *
   * @example
   * ```typescript
   * const communities = await client.listCommunities({ limit: 10 });
   * ```
   */
  async listCommunities(
    options: QueryOptions & { search?: string; tags?: string[] } = {}
  ): Promise<PaginatedResponse<Community>> {
    const params = new URLSearchParams();

    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.search) params.append('search', options.search);
    if (options.tags) params.append('tags', options.tags.join(','));

    const response = await this.client.get<ApiResponse<PaginatedResponse<Community>>>(
      `/api/communities?${params.toString()}`
    );

    return response.data.data!;
  }

  /**
   * Get community analytics
   *
   * @param communityId - Community ID
   * @returns Community analytics data
   *
   * @example
   * ```typescript
   * const analytics = await client.getCommunityAnalytics('community_id');
   * console.log(`Total members: ${analytics.totalMembers}`);
   * ```
   */
  async getCommunityAnalytics(communityId: string): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>(
      `/api/communities/${communityId}/analytics`
    );
    return response.data.data!;
  }

  /**
   * Get community leaderboard
   *
   * @param communityId - Community ID
   * @param limit - Number of top users to return
   * @returns Array of top badge earners
   *
   * @example
   * ```typescript
   * const leaderboard = await client.getCommunityLeaderboard('community_id', 10);
   * ```
   */
  async getCommunityLeaderboard(
    communityId: string,
    limit: number = 10
  ): Promise<any[]> {
    const response = await this.client.get<ApiResponse<any[]>>(
      `/api/communities/${communityId}/leaderboard?limit=${limit}`
    );
    return response.data.data!;
  }

  /**
   * Get a specific badge template
   *
   * @param templateId - Template ID
   * @returns Badge template information
   *
   * @example
   * ```typescript
   * const template = await client.getBadgeTemplate('template_id');
   * console.log(template.requirements);
   * ```
   */
  async getBadgeTemplate(templateId: string): Promise<BadgeTemplate> {
    const response = await this.client.get<BadgeTemplate>(
      `/api/badges/templates/${templateId}`
    );
    return response.data;
  }

  /**
   * Verify a badge exists and is valid
   *
   * @param badgeId - Badge ID to verify
   * @returns Whether the badge is valid
   *
   * @example
   * ```typescript
   * const isValid = await client.verifyBadge('badge_id');
   * ```
   */
  async verifyBadge(badgeId: string): Promise<boolean> {
    try {
      await this.getBadge(badgeId);
      return true;
    } catch (error) {
      if (error instanceof PassportXError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }
}
