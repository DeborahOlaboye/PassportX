/**
 * Unit tests for chainhook route input validation:
 *   - NaN guards and caps on limit params in GET /logs and /logs/errors
 *   - isNaN guards, date validation, and block-range cap for
 *     GET /events/historical, GET /events/statistics, POST /events/replay
 *   - String type/length validation for POST /subscriptions and POST /predicates
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../../services/chainhookManager', () => {
  const mockLogger = {
    getLogs: jest.fn().mockReturnValue([]),
    getLogCount: jest.fn().mockReturnValue(0),
    getLogStatistics: jest.fn().mockReturnValue({}),
    getErrorLogs: jest.fn().mockReturnValue([]),
  };
  const mockSubManager = {
    createSubscription: jest.fn().mockReturnValue({ id: 'sub-1' }),
    getSubscriptions: jest.fn().mockReturnValue([]),
  };
  const mockPredManager = {
    createPredicate: jest.fn().mockReturnValue({ id: 'pred-1' }),
    getPredicates: jest.fn().mockReturnValue([]),
  };
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getLogger: jest.fn().mockReturnValue(mockLogger),
      getSubscriptionManager: jest.fn().mockReturnValue(mockSubManager),
      getPredicateManager: jest.fn().mockReturnValue(mockPredManager),
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn().mockReturnValue({ running: true }),
    })),
  };
});

jest.mock('../../services/EventReplayService', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getHistoricalEvents: jest
      .fn()
      .mockResolvedValue({ events: [], total: 0, filters: {} }),
    getEventStatistics: jest.fn().mockResolvedValue({}),
    replayEvents: jest
      .fn()
      .mockResolvedValue({ replayed: 0, failed: 0, events: [] }),
  })),
}));

jest.mock('../../services/chainhookEventProcessor', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../../middleware/auth', () => ({
  authenticateToken: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import express from 'express';
import request from 'supertest';
import EventReplayService from '../../services/EventReplayService';

// Import after mocks
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: chainhookRouter, initializeChainhookRoutes } =
  require('../../routes/chainhook') as {
    default: express.Router;
    initializeChainhookRoutes: (m: unknown) => void;
  };

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ChainhookManager = require('../../services/chainhookManager').default;

const app = express();
app.use(express.json());
app.use('/chainhook', chainhookRouter);

const manager = new ChainhookManager();
initializeChainhookRoutes(manager);

function replaySpy() {
  return EventReplayService as jest.MockedClass<typeof EventReplayService>;
}

/** Returns the mock instance returned by the most recent new EventReplayService() call. */
function lastReplayInstance() {
  const results = replaySpy().mock.results;
  return results[results.length - 1]?.value as {
    getHistoricalEvents: jest.Mock;
    getEventStatistics: jest.Mock;
    replayEvents: jest.Mock;
  };
}

beforeEach(() => jest.clearAllMocks());

// ── GET /chainhook/logs ────────────────────────────────────────────────────

describe('GET /chainhook/logs', () => {
  it('uses default limit=100 when param is omitted', async () => {
    await request(app).get('/chainhook/logs').expect(200);
    expect(manager.getLogger().getLogs).toHaveBeenCalledWith(undefined, 100);
  });

  it('uses valid limit', async () => {
    await request(app).get('/chainhook/logs?limit=50').expect(200);
    expect(manager.getLogger().getLogs).toHaveBeenCalledWith(undefined, 50);
  });

  it('falls back to default when limit is NaN', async () => {
    await request(app).get('/chainhook/logs?limit=abc').expect(200);
    expect(manager.getLogger().getLogs).toHaveBeenCalledWith(undefined, 100);
  });

  it('caps limit at 1000', async () => {
    await request(app).get('/chainhook/logs?limit=9999').expect(200);
    expect(manager.getLogger().getLogs).toHaveBeenCalledWith(undefined, 1000);
  });

  it('falls back to default for negative limit', async () => {
    await request(app).get('/chainhook/logs?limit=-1').expect(200);
    expect(manager.getLogger().getLogs).toHaveBeenCalledWith(undefined, 100);
  });
});

// ── GET /chainhook/logs/errors ─────────────────────────────────────────────

describe('GET /chainhook/logs/errors', () => {
  it('uses default limit=50 when param is omitted', async () => {
    await request(app).get('/chainhook/logs/errors').expect(200);
    expect(manager.getLogger().getErrorLogs).toHaveBeenCalledWith(50);
  });

  it('uses valid limit', async () => {
    await request(app).get('/chainhook/logs/errors?limit=20').expect(200);
    expect(manager.getLogger().getErrorLogs).toHaveBeenCalledWith(20);
  });

  it('falls back to default when limit is NaN', async () => {
    await request(app).get('/chainhook/logs/errors?limit=xyz').expect(200);
    expect(manager.getLogger().getErrorLogs).toHaveBeenCalledWith(50);
  });

  it('caps limit at 500', async () => {
    await request(app).get('/chainhook/logs/errors?limit=9000').expect(200);
    expect(manager.getLogger().getErrorLogs).toHaveBeenCalledWith(500);
  });
});

// ── GET /chainhook/events/historical ──────────────────────────────────────

describe('GET /chainhook/events/historical', () => {
  function historicalFilters() {
    return lastReplayInstance().getHistoricalEvents.mock.calls[0][0];
  }

  it('uses default limit=100 and offset=0 when omitted', async () => {
    await request(app).get('/chainhook/events/historical').expect(200);
    expect(historicalFilters()).toMatchObject({ limit: 100, offset: 0 });
  });

  it('caps limit at 1000', async () => {
    await request(app)
      .get('/chainhook/events/historical?limit=5000')
      .expect(200);
    expect(historicalFilters().limit).toBe(1000);
  });

  it('falls back to default when limit is NaN', async () => {
    await request(app)
      .get('/chainhook/events/historical?limit=bad')
      .expect(200);
    expect(historicalFilters().limit).toBe(100);
  });

  it('returns 400 when endBlock < startBlock', async () => {
    const res = await request(app)
      .get('/chainhook/events/historical?startBlock=100&endBlock=50')
      .expect(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when block range exceeds 100,000', async () => {
    const res = await request(app)
      .get('/chainhook/events/historical?startBlock=0&endBlock=200000')
      .expect(400);
    expect(res.body).toHaveProperty('error');
  });

  it('accepts valid block range', async () => {
    await request(app)
      .get('/chainhook/events/historical?startBlock=100&endBlock=200')
      .expect(200);
    const f = historicalFilters();
    expect(f.startBlock).toBe(100);
    expect(f.endBlock).toBe(200);
  });

  it('ignores invalid date strings (passes undefined)', async () => {
    await request(app)
      .get('/chainhook/events/historical?startDate=notadate')
      .expect(200);
    expect(historicalFilters().startDate).toBeUndefined();
  });

  it('passes valid date strings as Date objects', async () => {
    await request(app)
      .get('/chainhook/events/historical?startDate=2024-01-01')
      .expect(200);
    expect(historicalFilters().startDate).toBeInstanceOf(Date);
  });
});

// ── POST /chainhook/events/replay ──────────────────────────────────────────

describe('POST /chainhook/events/replay', () => {
  function replayFilters() {
    return lastReplayInstance().replayEvents.mock.calls[0][0];
  }

  it('uses default limit=100 when omitted', async () => {
    await request(app).post('/chainhook/events/replay').send({}).expect(200);
    expect(replayFilters().limit).toBe(100);
  });

  it('caps limit at 1000', async () => {
    await request(app)
      .post('/chainhook/events/replay')
      .send({ limit: 9999 })
      .expect(200);
    expect(replayFilters().limit).toBe(1000);
  });

  it('returns 400 when endBlock < startBlock', async () => {
    const res = await request(app)
      .post('/chainhook/events/replay')
      .send({ startBlock: 200, endBlock: 100 })
      .expect(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when block range exceeds 100,000', async () => {
    const res = await request(app)
      .post('/chainhook/events/replay')
      .send({ startBlock: 0, endBlock: 200000 })
      .expect(400);
    expect(res.body).toHaveProperty('error');
  });

  it('ignores invalid date strings', async () => {
    await request(app)
      .post('/chainhook/events/replay')
      .send({ startDate: 'not-a-date' })
      .expect(200);
    expect(replayFilters().startDate).toBeUndefined();
  });
});

// ── POST /chainhook/subscriptions – string validation ─────────────────────

describe('POST /chainhook/subscriptions', () => {
  it('returns 400 when name exceeds 200 characters', async () => {
    const res = await request(app)
      .post('/chainhook/subscriptions')
      .send({ name: 'a'.repeat(201), eventType: 'badge_mint' })
      .expect(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when eventType exceeds 100 characters', async () => {
    const res = await request(app)
      .post('/chainhook/subscriptions')
      .send({ name: 'valid', eventType: 'x'.repeat(101) })
      .expect(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ── POST /chainhook/predicates – string/network validation ─────────────────

describe('POST /chainhook/predicates', () => {
  const baseBody = {
    name: 'test',
    type: 'contract_call',
    network: 'mainnet',
    if_this: {},
    then_that: {},
  };

  it('returns 400 when name exceeds 200 characters', async () => {
    const res = await request(app)
      .post('/chainhook/predicates')
      .send({ ...baseBody, name: 'a'.repeat(201) })
      .expect(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when network is not mainnet or testnet', async () => {
    const res = await request(app)
      .post('/chainhook/predicates')
      .send({ ...baseBody, network: 'devnet' })
      .expect(400);
    expect(res.body).toHaveProperty('error');
  });

  it('accepts mainnet network', async () => {
    const res = await request(app)
      .post('/chainhook/predicates')
      .send({ ...baseBody, network: 'mainnet' })
      .expect(201);
    expect(res.body.predicate).toHaveProperty('id');
  });

  it('accepts testnet network', async () => {
    const res = await request(app)
      .post('/chainhook/predicates')
      .send({ ...baseBody, network: 'testnet' })
      .expect(201);
    expect(res.body.predicate).toHaveProperty('id');
  });
});
