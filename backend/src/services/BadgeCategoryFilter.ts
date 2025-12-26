export type BadgeCategory =
  | 'skill'
  | 'event participation'
  | 'contribution'
  | 'leadership'
  | 'learning milestone';

export type BadgeLevel = 'beginner' | 'intermediate' | 'advanced';

export interface BadgeMetadata {
  category: BadgeCategory;
  level: BadgeLevel;
  timestamp: number;
}

export interface CategoryFilter {
  categories: BadgeCategory[];
  levels: BadgeLevel[];
}

export interface FilteredBadgeEvent {
  eventType: string;
  badgeId: string;
  userId: string;
  category: BadgeCategory;
  level: BadgeLevel;
  transactionHash: string;
  blockHeight: number;
  timestamp: number;
  metadata: any;
}

export class BadgeCategoryFilter {
  private static instance: BadgeCategoryFilter;

  // Map numeric levels to string levels
  private static LEVEL_MAP: Record<number, BadgeLevel> = {
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced'
  };

  // Valid categories
  private static VALID_CATEGORIES: BadgeCategory[] = [
    'skill',
    'event participation',
    'contribution',
    'leadership',
    'learning milestone'
  ];

  static getInstance(): BadgeCategoryFilter {
    if (!BadgeCategoryFilter.instance) {
      BadgeCategoryFilter.instance = new BadgeCategoryFilter();
    }
    return BadgeCategoryFilter.instance;
  }

  /**
   * Parse badge metadata from chainhook event
   */
  parseBadgeMetadata(eventData: any): BadgeMetadata | null {
    try {
      // Extract metadata from event data
      // This would depend on how the contract stores metadata
      const metadata = eventData.metadata || eventData;

      if (!metadata.category || !metadata.level) {
        return null;
      }

      const category = this.normalizeCategory(metadata.category);
      const level = this.normalizeLevel(metadata.level);

      if (!category || !level) {
        return null;
      }

      return {
        category,
        level,
        timestamp: metadata.timestamp || Date.now()
      };
    } catch (error) {
      console.error('Error parsing badge metadata:', error);
      return null;
    }
  }

  /**
   * Filter events by category and level
   */
  filterEvent(
    eventType: string,
    eventData: any,
    filter?: CategoryFilter
  ): FilteredBadgeEvent | null {
    const metadata = this.parseBadgeMetadata(eventData);

    if (!metadata) {
      return null;
    }

    // If no filter specified, include all
    if (!filter) {
      return this.createFilteredEvent(eventType, eventData, metadata);
    }

    // Check category filter
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(metadata.category)) {
        return null;
      }
    }

    // Check level filter
    if (filter.levels && filter.levels.length > 0) {
      if (!filter.levels.includes(metadata.level)) {
        return null;
      }
    }

    return this.createFilteredEvent(eventType, eventData, metadata);
  }

  /**
   * Create category-specific predicates for Chainhook
   */
  createCategoryPredicates(basePredicate: any, categories: BadgeCategory[]): any[] {
    return categories.map(category => ({
      ...basePredicate,
      name: `${basePredicate.name}-${category.replace(/\s+/g, '-')}`,
      if_this: {
        ...basePredicate.if_this,
        // Add category filtering logic here
        // This would require contract-specific filtering
      }
    }));
  }

  /**
   * Get all valid categories
   */
  getValidCategories(): BadgeCategory[] {
    return [...BadgeCategoryFilter.VALID_CATEGORIES];
  }

  /**
   * Get all valid levels
   */
  getValidLevels(): BadgeLevel[] {
    return ['beginner', 'intermediate', 'advanced'];
  }

  private normalizeCategory(category: string | number): BadgeCategory | null {
    if (typeof category === 'string') {
      const normalized = category.toLowerCase().trim();
      return BadgeCategoryFilter.VALID_CATEGORIES.find(cat =>
        cat.toLowerCase() === normalized
      ) || null;
    }

    // If numeric, map to category (assuming 1=skill, 2=event, etc.)
    const categoryMap: Record<number, BadgeCategory> = {
      1: 'skill',
      2: 'event participation',
      3: 'contribution',
      4: 'leadership',
      5: 'learning milestone'
    };

    return categoryMap[category] || null;
  }

  private normalizeLevel(level: string | number): BadgeLevel | null {
    if (typeof level === 'string') {
      const normalized = level.toLowerCase().trim();
      if (['beginner', 'intermediate', 'advanced'].includes(normalized)) {
        return normalized as BadgeLevel;
      }
    }

    if (typeof level === 'number') {
      return BadgeCategoryFilter.LEVEL_MAP[level] || null;
    }

    return null;
  }

  private createFilteredEvent(
    eventType: string,
    eventData: any,
    metadata: BadgeMetadata
  ): FilteredBadgeEvent {
    return {
      eventType,
      badgeId: eventData.badgeId || eventData.id || '',
      userId: eventData.userId || eventData.owner || '',
      category: metadata.category,
      level: metadata.level,
      transactionHash: eventData.transactionHash || '',
      blockHeight: eventData.blockHeight || 0,
      timestamp: metadata.timestamp,
      metadata: eventData
    };
  }
}

export default BadgeCategoryFilter;