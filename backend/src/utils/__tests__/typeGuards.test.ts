import {
  isPopulatedBadge,
  isPopulatedBadgeTemplate,
  isCommunity,
  isBadgeTemplate
} from '../typeGuards';

describe('Type Guards', () => {
  describe('isPopulatedBadge', () => {
    it('should return true for valid populated badge', () => {
      const badge = {
        _id: '123',
        templateId: {
          name: 'Test Badge',
          description: 'Test Description',
          level: 1,
          category: 'skill'
        },
        community: {
          name: 'Test Community',
          admins: ['SP123']
        },
        owner: 'SP456',
        issuer: 'SP123',
        metadata: {
          level: 1,
          category: 'skill',
          timestamp: 123456
        }
      };

      expect(isPopulatedBadge(badge)).toBe(true);
    });

    it('should return false for unpopulated badge', () => {
      const badge = {
        _id: '123',
        templateId: '456',
        community: '789',
        owner: 'SP456',
        issuer: 'SP123'
      };

      expect(isPopulatedBadge(badge)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isPopulatedBadge(null)).toBe(false);
    });
  });

  describe('isPopulatedBadgeTemplate', () => {
    it('should return true for valid populated template', () => {
      const template = {
        _id: '123',
        name: 'Test Template',
        description: 'Test Description',
        level: 1,
        category: 'skill',
        community: {
          name: 'Test Community',
          admins: ['SP123']
        }
      };

      expect(isPopulatedBadgeTemplate(template)).toBe(true);
    });

    it('should return false for unpopulated template', () => {
      const template = {
        _id: '123',
        name: 'Test Template',
        community: '456'
      };

      expect(isPopulatedBadgeTemplate(template)).toBe(false);
    });
  });

  describe('isCommunity', () => {
    it('should return true for valid community', () => {
      const community = {
        _id: '123',
        name: 'Test Community',
        admins: ['SP123', 'SP456'],
        slug: 'test-community'
      };

      expect(isCommunity(community)).toBe(true);
    });

    it('should return false for invalid community', () => {
      const notCommunity = {
        _id: '123',
        name: 'Test'
      };

      expect(isCommunity(notCommunity)).toBe(false);
    });
  });

  describe('isBadgeTemplate', () => {
    it('should return true for valid badge template', () => {
      const template = {
        _id: '123',
        name: 'Test Badge',
        description: 'Test Description',
        level: 1,
        category: 'skill'
      };

      expect(isBadgeTemplate(template)).toBe(true);
    });

    it('should return false for invalid badge template', () => {
      const notTemplate = {
        _id: '123',
        name: 'Test'
      };

      expect(isBadgeTemplate(notTemplate)).toBe(false);
    });
  });
});
