import { CategoryHandler } from './BaseCategoryHandler'
import { FilteredBadgeEvent, BadgeCategory } from '../BadgeCategoryFilter'
import { SkillCategoryHandler } from './SkillCategoryHandler'
import { EventParticipationCategoryHandler } from './EventParticipationCategoryHandler'
import { ContributionCategoryHandler } from './ContributionCategoryHandler'
import { LeadershipCategoryHandler } from './LeadershipCategoryHandler'
import { LearningMilestoneCategoryHandler } from './LearningMilestoneCategoryHandler'

export class CategoryHandlerManager {
  private static instance: CategoryHandlerManager;
  private handlers: Map<BadgeCategory, CategoryHandler> = new Map();
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
    this.initializeHandlers();
  }

  static getInstance(logger?: any): CategoryHandlerManager {
    if (!CategoryHandlerManager.instance) {
      CategoryHandlerManager.instance = new CategoryHandlerManager(logger);
    }
    return CategoryHandlerManager.instance;
  }

  /**
   * Process a filtered badge event using the appropriate category handler
   */
  async processEvent(event: FilteredBadgeEvent): Promise<any> {
    const handler = this.handlers.get(event.category);

    if (!handler) {
      this.logger.warn(`No handler found for category: ${event.category}`);
      return null;
    }

    if (!handler.canHandle(event)) {
      this.logger.warn(`Handler cannot handle event for category: ${event.category}`);
      return null;
    }

    try {
      this.logger.info(`Processing event with ${event.category} handler`);
      return await handler.processEvent(event);
    } catch (error) {
      this.logger.error(`Error processing event with ${event.category} handler:`, error);
      throw error;
    }
  }

  /**
   * Get handler for a specific category
   */
  getHandler(category: BadgeCategory): CategoryHandler | undefined {
    return this.handlers.get(category);
  }

  /**
   * Get all registered categories
   */
  getRegisteredCategories(): BadgeCategory[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Register a custom handler for a category
   */
  registerHandler(category: BadgeCategory, handler: CategoryHandler): void {
    this.handlers.set(category, handler);
    this.logger.info(`Registered custom handler for category: ${category}`);
  }

  /**
   * Unregister a handler
   */
  unregisterHandler(category: BadgeCategory): boolean {
    const removed = this.handlers.delete(category);
    if (removed) {
      this.logger.info(`Unregistered handler for category: ${category}`);
    }
    return removed;
  }

  private initializeHandlers(): void {
    // Register default handlers
    this.handlers.set('skill', new SkillCategoryHandler(this.logger));
    this.handlers.set('event participation', new EventParticipationCategoryHandler(this.logger));
    this.handlers.set('contribution', new ContributionCategoryHandler(this.logger));
    this.handlers.set('leadership', new LeadershipCategoryHandler(this.logger));
    this.handlers.set('learning milestone', new LearningMilestoneCategoryHandler(this.logger));

    this.logger.info('Initialized category handlers');
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[CategoryHandlerManager] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[CategoryHandlerManager] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[CategoryHandlerManager] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[CategoryHandlerManager] ${msg}`, ...args)
    };
  }
}

export default CategoryHandlerManager;