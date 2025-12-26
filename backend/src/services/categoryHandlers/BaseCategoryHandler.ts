import { FilteredBadgeEvent, BadgeCategory, BadgeLevel } from '../BadgeCategoryFilter'
import { ChainhookEventPayload } from '../../../src/chainhook/types/handlers'

export interface CategoryHandler {
  getCategory(): BadgeCategory;
  canHandle(event: FilteredBadgeEvent): boolean;
  processEvent(event: FilteredBadgeEvent): Promise<any>;
}

export abstract class BaseCategoryHandler implements CategoryHandler {
  protected category: BadgeCategory;
  protected logger: any;

  constructor(category: BadgeCategory, logger?: any) {
    this.category = category;
    this.logger = logger || this.getDefaultLogger();
  }

  getCategory(): BadgeCategory {
    return this.category;
  }

  canHandle(event: FilteredBadgeEvent): boolean {
    return event.category === this.category;
  }

  abstract processEvent(event: FilteredBadgeEvent): Promise<any>;

  protected getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[${this.category}] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[${this.category}] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[${this.category}] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[${this.category}] ${msg}`, ...args)
    };
  }

  protected async sendNotification(event: FilteredBadgeEvent, message: string): Promise<void> {
    // Implementation would integrate with notification service
    this.logger.info(`Sending notification for ${this.category} badge: ${message}`);
  }

  protected async updateAnalytics(event: FilteredBadgeEvent): Promise<void> {
    // Implementation would update analytics
    this.logger.info(`Updating analytics for ${this.category} badge event`);
  }
}