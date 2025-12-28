# Badge Category Filtering Documentation

## Overview

PassportX implements advanced event filtering for badge categories and levels, enabling targeted notifications and analytics for specific types of badge achievements.

## Features

- Category-based event filtering
- Level-based event filtering
- Category-specific handlers
- Webhook subscriptions by category
- Comprehensive documentation

## Badge Categories

The system supports the following badge categories:

- **skill**: Technical or professional skills
- **event participation**: Community event attendance
- **contribution**: Community contributions and volunteering
- **leadership**: Leadership roles and activities
- **learning milestone**: Educational achievements

## Badge Levels

Badges are categorized by difficulty/complexity levels:

- **beginner**: Entry-level achievements
- **intermediate**: Moderate complexity
- **advanced**: High-level achievements

## Category Filtering

### Webhook Subscriptions

Webhooks can subscribe to specific categories and levels:

```json
{
  "url": "https://your-service.com/webhook",
  "events": ["badge_mint"],
  "categories": ["skill", "leadership"],
  "levels": ["intermediate", "advanced"]
}
```

### Filtering Logic

Events are filtered at the application level before webhook delivery:

1. Parse badge metadata from chainhook events
2. Apply category and level filters
3. Route to appropriate category handlers
4. Deliver to subscribed webhooks

### Performance Optimization

- Filtering occurs at the application level, not in Chainhook predicates
- Category handlers process events asynchronously
- Webhook subscriptions reduce unnecessary deliveries

## Category-Specific Handlers

Each category has a dedicated handler for specialized processing:

### Skill Handler
- Tracks skill progression
- Updates skill analytics
- Sends skill-specific notifications

### Event Participation Handler
- Records event attendance
- Tracks participation metrics
- Manages event-based achievements

### Contribution Handler
- Monitors community contributions
- Tracks volunteer activities
- Recognizes community impact

### Leadership Handler
- Identifies leadership activities
- Tracks leadership roles
- Recognizes community leadership

### Learning Milestone Handler
- Monitors educational progress
- Tracks learning achievements
- Recognizes knowledge growth

## API Endpoints

### Register Category Webhook

```http
POST /api/webhooks/register
```

```json
{
  "url": "https://example.com/webhook",
  "events": ["badge_mint"],
  "categories": ["skill", "leadership"],
  "levels": ["intermediate", "advanced"],
  "secret": "optional-secret"
}
```

### Update Webhook Subscriptions

```http
PUT /api/webhooks/:id
```

```json
{
  "categories": ["skill", "learning milestone"],
  "levels": ["advanced"]
}
```

## Event Payload Format

Category-filtered events include additional metadata:

```json
{
  "event": "badge_skill",
  "data": {
    "eventType": "badge_mint",
    "badgeId": "badge-123",
    "userId": "user-456",
    "category": "skill",
    "level": "intermediate",
    "transactionHash": "0x...",
    "blockHeight": 12345,
    "timestamp": 1640995200000,
    "metadata": { /* original event data */ }
  },
  "timestamp": "2025-12-26T12:00:00.000Z",
  "signature": "webhook-signature"
}
```

## Adding New Categories

To add a new badge category:

1. Update `BadgeCategory` type in `BadgeCategoryFilter.ts`
2. Add to `VALID_CATEGORIES` array
3. Create a new category handler extending `BaseCategoryHandler`
4. Register the handler in `CategoryHandlerManager`
5. Update documentation

Example:

```typescript
// Add to BadgeCategoryFilter.ts
export type BadgeCategory =
  | 'skill'
  | 'event participation'
  | 'contribution'
  | 'leadership'
  | 'learning milestone'
  | 'new_category'; // Add new category

// Add to VALID_CATEGORIES
private static VALID_CATEGORIES: BadgeCategory[] = [
  'skill',
  'event participation',
  'contribution',
  'leadership',
  'learning milestone',
  'new_category' // Add here
];

// Create handler
export class NewCategoryHandler extends BaseCategoryHandler {
  constructor(logger?: any) {
    super('new_category', logger);
  }

  async processEvent(event: FilteredBadgeEvent): Promise<any> {
    // Implement category-specific logic
  }
}

// Register in CategoryHandlerManager
this.handlers.set('new_category', new NewCategoryHandler(this.logger));
```

## Testing

### Unit Tests

Test category filtering logic:

```typescript
describe('BadgeCategoryFilter', () => {
  it('should filter events by category', () => {
    const filter = { categories: ['skill'] };
    const event = createMockBadgeEvent('skill', 'intermediate');

    const result = categoryFilter.filterEvent('badge_mint', event, filter);

    expect(result?.category).toBe('skill');
  });
});
```

### Integration Tests

Test webhook category subscriptions:

```typescript
describe('Category Webhooks', () => {
  it('should deliver events to category subscribers', async () => {
    // Register webhook with category filter
    // Trigger badge event
    // Verify webhook receives filtered event
  });
});
```

## Monitoring

Monitor category filtering performance:

- Event processing latency by category
- Webhook delivery success rates by category
- Handler execution times
- Subscription management metrics

## Troubleshooting

### Common Issues

1. **Events not filtered**: Check category metadata parsing
2. **Webhooks not receiving events**: Verify category subscriptions
3. **Handler errors**: Check category handler implementations
4. **Performance issues**: Monitor filtering at predicate level

### Debug Mode

Enable debug logging for category filtering:

```typescript
const categoryFilter = BadgeCategoryFilter.getInstance();
// Debug logs enabled automatically
```