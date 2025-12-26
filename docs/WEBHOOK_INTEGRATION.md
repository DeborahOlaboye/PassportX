# Webhook Integration Documentation

## Overview

PassportX provides webhook endpoints that forward Chainhook events to external services, enabling integrations with Discord, Slack, and other platforms.

## Features

- Secure webhook registration
- Event filtering by type
- Automatic retry on failure
- HMAC signature verification
- Comprehensive documentation

## Webhook Registration

### Register a Webhook

**Endpoint:** `POST /api/webhooks/register`

**Request Body:**
```json
{
  "url": "https://your-service.com/webhook",
  "events": ["badge_mint", "badge_verification", "community_update"],
  "secret": "optional-custom-secret"
}
```

- `url`: The webhook URL to receive events
- `events`: Array of event types to subscribe to
- `secret`: Optional custom secret for signature verification (auto-generated if not provided)

**Response:**
```json
{
  "message": "Webhook registered successfully",
  "webhook": {
    "id": "webhook-id",
    "url": "https://your-service.com/webhook",
    "events": ["badge_mint"],
    "isActive": true,
    "createdAt": "2025-12-26T12:00:00.000Z"
  }
}
```

## Event Payload Format

When an event occurs, the webhook receives a POST request with the following payload:

```json
{
  "event": "badge_mint",
  "data": {
    "id": "event-id",
    "contractAddress": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    "method": "mint-badge",
    "transactionHash": "0x123...",
    "blockHeight": 12345,
    "timestamp": 1640995200000,
    "originalEvent": {
      // Full chainhook event data
    }
  },
  "timestamp": "2025-12-26T12:00:00.000Z",
  "signature": "sha256-signature"
}
```

### Headers

- `Content-Type: application/json`
- `X-Webhook-Signature: sha256-signature`
- `User-Agent: PassportX-Webhook/1.0`

## Signature Verification

Webhooks are signed using HMAC-SHA256 with your webhook secret. To verify:

```javascript
const crypto = require('crypto')

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

## Supported Events

- `badge_mint`: When a badge is minted
- `badge_verification`: When a badge is verified
- `community_update`: When community data is updated
- `test`: Test event for webhook validation

## Managing Webhooks

### List Webhooks

**Endpoint:** `GET /api/webhooks`

### Update Webhook

**Endpoint:** `PUT /api/webhooks/:id`

**Request Body:**
```json
{
  "events": ["badge_mint", "badge_verification"],
  "isActive": true
}
```

### Delete Webhook

**Endpoint:** `DELETE /api/webhooks/:id`

### Test Webhook

**Endpoint:** `POST /api/webhooks/:id/test`

Sends a test payload to verify the webhook is working.

### Retry Failed Webhooks

**Endpoint:** `POST /api/webhooks/retry-failed`

Manually triggers retry for webhooks that previously failed.

## Error Handling

- Failed deliveries are automatically retried
- Webhooks are deactivated after 5 consecutive failures
- Use the retry endpoint to reactivate and retry failed webhooks

## Rate Limiting

Webhook deliveries are subject to rate limiting. High-volume events may be batched or throttled.

## Security

- All webhooks require authentication
- Payloads are signed for verification
- HTTPS is required for webhook URLs
- Failed webhooks are automatically disabled after multiple failures