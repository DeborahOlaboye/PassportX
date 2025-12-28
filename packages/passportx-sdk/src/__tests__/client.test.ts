/**
 * PassportX SDK Client Tests
 */

import { PassportX, PassportXError } from '../client';

// Mock axios
jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PassportX SDK', () => {
  let client: PassportX;

  beforeEach(() => {
    client = new PassportX({
      apiUrl: 'https://test.api.passportx.app',
      network: 'testnet'
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const defaultClient = new PassportX();
      expect(defaultClient).toBeInstanceOf(PassportX);
    });

    it('should initialize with custom config', () => {
      const customClient = new PassportX({
        apiUrl: 'https://custom.api',
        network: 'mainnet',
        timeout: 5000
      });
      expect(customClient).toBeInstanceOf(PassportX);
    });

    it('should create axios instance with correct config', () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://test.api.passportx.app',
          timeout: 10000
        })
      );
    });
  });

  describe('getUserBadges', () => {
    const mockBadges = [
      {
        id: 'badge1',
        owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        template: {
          id: 'template1',
          name: 'Test Badge',
          category: 'achievement',
          level: 1
        },
        metadata: {
          level: 1,
          category: 'achievement',
          timestamp: Date.now()
        }
      }
    ];

    it('should fetch user badges', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: mockBadges });
      (client as any).client.get = mockGet;

      const result = await client.getUserBadges('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

      expect(result).toEqual(mockBadges);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM/badges')
      );
    });

    it('should fetch user badges with filters', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: mockBadges });
      (client as any).client.get = mockGet;

      await client.getUserBadges('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', {
        category: 'achievement',
        level: 1,
        limit: 10,
        offset: 0
      });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('category=achievement')
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('level=1')
      );
    });
  });

  describe('getBadge', () => {
    const mockBadge = {
      id: 'badge1',
      owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      template: {
        id: 'template1',
        name: 'Test Badge'
      },
      metadata: {
        level: 1,
        category: 'achievement',
        timestamp: Date.now()
      }
    };

    it('should fetch a specific badge', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: mockBadge });
      (client as any).client.get = mockGet;

      const result = await client.getBadge('badge1');

      expect(result).toEqual(mockBadge);
      expect(mockGet).toHaveBeenCalledWith('/api/badges/badge1');
    });
  });

  describe('getBadgeMetadata', () => {
    it('should fetch badge metadata', async () => {
      const mockBadge = {
        id: 'badge1',
        metadata: {
          level: 2,
          category: 'skill',
          timestamp: Date.now()
        }
      };

      const mockGet = jest.fn().mockResolvedValue({ data: mockBadge });
      (client as any).client.get = mockGet;

      const result = await client.getBadgeMetadata('badge1');

      expect(result).toEqual(mockBadge.metadata);
    });
  });

  describe('getCommunity', () => {
    const mockCommunity = {
      id: 'community1',
      name: 'Test Community',
      slug: 'test-community',
      description: 'A test community',
      admins: ['ST1...'],
      memberCount: 100
    };

    it('should fetch community by ID', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { success: true, data: mockCommunity }
      });
      (client as any).client.get = mockGet;

      const result = await client.getCommunity('community1');

      expect(result).toEqual(mockCommunity);
      expect(mockGet).toHaveBeenCalledWith('/api/communities/community1');
    });

    it('should fetch community by slug', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { success: true, data: mockCommunity }
      });
      (client as any).client.get = mockGet;

      const result = await client.getCommunity('test-community');

      expect(result).toEqual(mockCommunity);
    });
  });

  describe('getCommunityBadges', () => {
    const mockTemplates = [
      {
        id: 'template1',
        name: 'Template 1',
        category: 'achievement',
        level: 1
      },
      {
        id: 'template2',
        name: 'Template 2',
        category: 'skill',
        level: 2
      }
    ];

    it('should fetch community badge templates', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: mockTemplates });
      (client as any).client.get = mockGet;

      const result = await client.getCommunityBadges('community1');

      expect(result).toEqual(mockTemplates);
      expect(mockGet).toHaveBeenCalledWith('/api/badges/templates/community/community1');
    });
  });

  describe('listCommunities', () => {
    const mockResponse = {
      data: [
        { id: 'c1', name: 'Community 1' },
        { id: 'c2', name: 'Community 2' }
      ],
      pagination: {
        total: 2,
        limit: 10,
        offset: 0,
        hasMore: false
      }
    };

    it('should list communities', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { success: true, data: mockResponse }
      });
      (client as any).client.get = mockGet;

      const result = await client.listCommunities({ limit: 10 });

      expect(result).toEqual(mockResponse);
    });

    it('should list communities with search', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { success: true, data: mockResponse }
      });
      (client as any).client.get = mockGet;

      await client.listCommunities({
        search: 'test',
        tags: ['tag1', 'tag2']
      });

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('search=test')
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('tags=tag1%2Ctag2')
      );
    });
  });

  describe('verifyBadge', () => {
    it('should return true for valid badge', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        data: { id: 'badge1' }
      });
      (client as any).client.get = mockGet;

      const result = await client.verifyBadge('badge1');

      expect(result).toBe(true);
    });

    it('should return false for invalid badge', async () => {
      const mockGet = jest.fn().mockRejectedValue(
        new PassportXError('Not found', 'NOT_FOUND', 404)
      );
      (client as any).client.get = mockGet;

      const result = await client.verifyBadge('invalid');

      expect(result).toBe(false);
    });

    it('should throw error for non-404 errors', async () => {
      const mockGet = jest.fn().mockRejectedValue(
        new PassportXError('Server error', 'SERVER_ERROR', 500)
      );
      (client as any).client.get = mockGet;

      await expect(client.verifyBadge('badge1')).rejects.toThrow(PassportXError);
    });
  });

  describe('Error Handling', () => {
    it('should handle PassportXError correctly', () => {
      const error = new PassportXError('Test error', 'TEST_CODE', 400, { detail: 'test' });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('PassportXError');
    });
  });
});
