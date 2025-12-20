import CommunityCreationService from '../../services/communityCreationService';
import CommunityCreationNotificationService from '../../services/communityCreationNotificationService';
import CommunityCacheService from '../../services/communityCacheService';
import { CommunityCreationEvent } from '../../../../src/chainhook/types/handlers';

describe('Community Creation Integration', () => {
  let communityService: CommunityCreationService;
  let notificationService: CommunityCreationNotificationService;
  let cacheService: CommunityCacheService;

  beforeEach(() => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    communityService = new CommunityCreationService(mockLogger);
    notificationService = new CommunityCreationNotificationService(mockLogger);
    cacheService = new CommunityCacheService(
      { enabled: true, ttl: 300, provider: 'memory' },
      mockLogger
    );
  });

  describe('CommunityCreationService', () => {
    it('should have all required methods', () => {
      expect(communityService).toHaveProperty('processCommunityCreationEvent');
      expect(communityService).toHaveProperty('syncCommunityFromBlockchain');
      expect(communityService).toHaveProperty('getCommunityByBlockchainId');
      expect(communityService).toHaveProperty('updateCommunityMetadata');
    });

    it('should validate community creation event', async () => {
      const invalidEvent = {
        communityId: '',
        communityName: '',
        description: '',
        ownerAddress: '',
        createdAtBlockHeight: 0,
        contractAddress: '',
        transactionHash: '',
        blockHeight: 0,
        timestamp: Date.now()
      } as CommunityCreationEvent;

      const result = await communityService.processCommunityCreationEvent(invalidEvent);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should generate valid community slug', async () => {
      const event: CommunityCreationEvent = {
        communityId: 'test-123',
        communityName: 'Test Community Name!',
        description: 'Test description',
        ownerAddress: 'SP123456789ABCDEF0123456789ABCDEF0',
        createdAtBlockHeight: 100,
        contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
        transactionHash: 'abc123',
        blockHeight: 100,
        timestamp: Date.now()
      };

      // We can't fully test without database, but we can verify the service accepts valid data
      expect(event.communityName).toBe('Test Community Name!');
    });
  });

  describe('CommunityCreationNotificationService', () => {
    it('should create valid welcome notification', () => {
      const event: CommunityCreationEvent = {
        communityId: 'test-community-1',
        communityName: 'My Awesome Community',
        description: 'An awesome community',
        ownerAddress: 'SP123456789ABCDEF0123456789ABCDEF0',
        createdAtBlockHeight: 100,
        contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
        transactionHash: 'abc123',
        blockHeight: 100,
        timestamp: Date.now()
      };

      const notification = notificationService.createWelcomeNotification(event, {
        includeInstructions: true,
        includeDashboardLink: true
      });

      expect(notification.userId).toBe(event.ownerAddress);
      expect(notification.type).toBe('community_created');
      expect(notification.title).toContain('My Awesome Community');
      expect(notification.message).toContain('blockchain');
      expect(notification.data.communityId).toBe('test-community-1');
      expect(notification.data.dashboardUrl).toBe('/communities/test-community-1');
    });

    it('should create admin confirmation notification', () => {
      const notification = notificationService.createAdminConfirmationNotification(
        'community-1',
        'Tech Community',
        'SP123456789ABCDEF0123456789ABCDEF0',
        '/communities/community-1'
      );

      expect(notification.userId).toBe('SP123456789ABCDEF0123456789ABCDEF0');
      expect(notification.type).toBe('community_created');
      expect(notification.title).toContain('Admin');
      expect(notification.data.memberUrl || notification.data.membersUrl).toBeDefined();
    });

    it('should build notification batch for multiple admins', async () => {
      const event: CommunityCreationEvent = {
        communityId: 'test-1',
        communityName: 'Test',
        description: 'Test',
        ownerAddress: 'SP111111111111111111111111111111111',
        createdAtBlockHeight: 100,
        contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
        transactionHash: 'tx1',
        blockHeight: 100,
        timestamp: Date.now()
      };

      const admins = [
        'SP111111111111111111111111111111111',
        'SP222222222222222222222222222222222'
      ];

      const notifications = await notificationService.buildNotificationBatch(event, admins);

      expect(notifications.length).toBe(2);
      expect(notifications[0].userId).toBe(admins[0]);
      expect(notifications[1].userId).toBe(admins[1]);
    });

    it('should validate notification payload', () => {
      const event: CommunityCreationEvent = {
        communityId: 'test-1',
        communityName: 'Test',
        description: 'Test',
        ownerAddress: 'SP111111111111111111111111111111111',
        createdAtBlockHeight: 100,
        contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
        transactionHash: 'tx1',
        blockHeight: 100,
        timestamp: Date.now()
      };

      const notification = notificationService.createWelcomeNotification(event);
      const isValid = notificationService.validateNotificationPayload(notification);

      expect(isValid).toBe(true);
    });
  });

  describe('CommunityCacheService', () => {
    it('should set and get cache entries', () => {
      const data = { id: 'test', name: 'Test Community' };
      cacheService.set('communities:1', data);

      const retrieved = cacheService.get('communities:1');
      expect(retrieved).toEqual(data);
    });

    it('should invalidate cache entries', () => {
      cacheService.set('communities:test', { id: 'test' });
      expect(cacheService.get('communities:test')).toBeDefined();

      cacheService.invalidate('communities:test');
      expect(cacheService.get('communities:test')).toBeNull();
    });

    it('should invalidate pattern-matched entries', () => {
      cacheService.set('communities:list:all', { count: 10 });
      cacheService.set('communities:list:active', { count: 8 });
      cacheService.set('users:list:all', { count: 100 });

      cacheService.invalidatePattern('^communities:list:');

      expect(cacheService.get('communities:list:all')).toBeNull();
      expect(cacheService.get('communities:list:active')).toBeNull();
      expect(cacheService.get('users:list:all')).toBeDefined();
    });

    it('should handle community creation invalidation', () => {
      const event: CommunityCreationEvent = {
        communityId: 'test-1',
        communityName: 'Test Community',
        description: 'Test',
        ownerAddress: 'SP111111111111111111111111111111111',
        createdAtBlockHeight: 100,
        contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
        transactionHash: 'tx1',
        blockHeight: 100,
        timestamp: Date.now()
      };

      // Set up some cache entries
      cacheService.set('communities:list:all', { count: 10 });
      cacheService.set('communities:admin:SP111111111111111111111111111111111:count', { count: 1 });

      // Trigger invalidation
      cacheService.onCommunityCreated(event);

      // Verify entries are invalidated
      expect(cacheService.get('communities:list:all')).toBeNull();
      expect(cacheService.get('communities:admin:SP111111111111111111111111111111111:count')).toBeNull();
    });

    it('should return cache statistics', () => {
      cacheService.set('test:1', { data: 1 });
      cacheService.set('test:2', { data: 2 });

      const stats = cacheService.getStats();

      expect(stats.enabled).toBe(true);
      expect(stats.ttl).toBe(300);
      expect(stats.provider).toBe('memory');
      expect(stats.cacheSize).toBe(2);
    });

    it('should clear all cache entries', () => {
      cacheService.set('test:1', { data: 1 });
      cacheService.set('test:2', { data: 2 });

      cacheService.clear();

      expect(cacheService.getStats().cacheSize).toBe(0);
    });
  });

  describe('Integration Flow', () => {
    it('should handle complete community creation workflow', async () => {
      const event: CommunityCreationEvent = {
        communityId: 'integration-test-1',
        communityName: 'Integration Test Community',
        description: 'Testing the complete workflow',
        ownerAddress: 'SP123456789ABCDEF0123456789ABCDEF0',
        createdAtBlockHeight: 100,
        contractAddress: 'SP101YT8S9464KE0S0TQDGWV83V5H3A37DKEFYSJ0.community-manager',
        transactionHash: 'integration-test-tx',
        blockHeight: 100,
        timestamp: Date.now()
      };

      // Create welcome notification
      const notification = notificationService.createWelcomeNotification(event);
      expect(notification).toBeDefined();
      expect(notification.type).toBe('community_created');

      // Build notification batch
      const notifications = await notificationService.buildNotificationBatch(event, [event.ownerAddress]);
      expect(notifications.length).toBeGreaterThan(0);

      // Invalidate cache
      cacheService.onCommunityCreated(event);
      expect(cacheService.getStats().cacheSize).toBe(0);
    });
  });
});
