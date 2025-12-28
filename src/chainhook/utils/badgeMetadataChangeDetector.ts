import { BadgeMetadataUpdateEvent } from '../types/handlers';

export interface MetadataChange {
  field: string;
  previousValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

export interface ChangeDetectionResult {
  hasChanges: boolean;
  changes: MetadataChange[];
  changedFields: string[];
  changeCount: number;
}

export class BadgeMetadataChangeDetector {
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || this.getDefaultLogger();
  }

  private getDefaultLogger() {
    return {
      debug: (msg: string, ...args: any[]) => console.debug(`[ChangeDetector] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[ChangeDetector] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[ChangeDetector] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ChangeDetector] ${msg}`, ...args)
    };
  }

  detectChanges(event: BadgeMetadataUpdateEvent): ChangeDetectionResult {
    const changes: MetadataChange[] = [];

    // Level change detection
    if (event.previousLevel !== event.level) {
      changes.push({
        field: 'level',
        previousValue: event.previousLevel,
        newValue: event.level,
        changeType: event.previousLevel === undefined ? 'added' : 'modified'
      });
    }

    // Category change detection
    if (event.previousCategory !== event.category) {
      changes.push({
        field: 'category',
        previousValue: event.previousCategory,
        newValue: event.category,
        changeType: event.previousCategory === undefined ? 'added' : 'modified'
      });
    }

    // Description change detection
    if (event.previousDescription !== event.description) {
      changes.push({
        field: 'description',
        previousValue: event.previousDescription,
        newValue: event.description,
        changeType: event.previousDescription === undefined ? 'added' : 'modified'
      });
    }

    const changedFields = changes.map(c => c.field);

    this.logger.debug(`Detected ${changes.length} metadata changes for badge: ${event.badgeId}`, {
      fields: changedFields
    });

    return {
      hasChanges: changes.length > 0,
      changes,
      changedFields,
      changeCount: changes.length
    };
  }

  generateChangeDescription(change: MetadataChange): string {
    switch (change.changeType) {
      case 'added':
        return `Added ${change.field}: ${change.newValue}`;
      case 'removed':
        return `Removed ${change.field}`;
      case 'modified':
        return `Changed ${change.field} from "${change.previousValue}" to "${change.newValue}"`;
      default:
        return `Updated ${change.field}`;
    }
  }

  generateSummary(result: ChangeDetectionResult): string {
    if (!result.hasChanges) {
      return 'No metadata changes detected';
    }

    const descriptions = result.changes.map(c => this.generateChangeDescription(c));
    return descriptions.join(', ');
  }

  getImpactLevel(result: ChangeDetectionResult): 'low' | 'medium' | 'high' {
    if (!result.hasChanges) {
      return 'low';
    }

    if (result.changeCount === 1 && result.changes[0].field === 'description') {
      return 'low';
    }

    if (result.changes.some(c => c.field === 'level')) {
      return 'high';
    }

    return 'medium';
  }

  shouldRefreshUI(result: ChangeDetectionResult): boolean {
    return result.hasChanges && result.changeCount > 0;
  }

  shouldInvalidateCache(result: ChangeDetectionResult): boolean {
    if (!result.hasChanges) {
      return false;
    }

    return result.changes.some(c => 
      c.field === 'level' || c.field === 'category' || c.field === 'description'
    );
  }

  groupChangesByType(result: ChangeDetectionResult): Record<string, MetadataChange[]> {
    const grouped: Record<string, MetadataChange[]> = {
      added: [],
      modified: [],
      removed: []
    };

    for (const change of result.changes) {
      grouped[change.changeType].push(change);
    }

    return grouped;
  }
}

export default BadgeMetadataChangeDetector;
