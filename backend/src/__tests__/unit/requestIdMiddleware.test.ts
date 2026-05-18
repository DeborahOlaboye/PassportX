import { Request, Response, NextFunction } from 'express';
import { requestId } from '../../middleware/requestId';

function makeMocks() {
  const req = { headers: {} } as unknown as Request;
  const res = {
    setHeader: jest.fn(),
  } as unknown as Response;
  const next: NextFunction = jest.fn();
  return { req, res, next };
}

describe('requestId middleware', () => {
  it('attaches a UUID requestId to req when no header provided', () => {
    const { req, res, next } = makeMocks();
    requestId(req, res, next);
    expect(req.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('uses the X-Request-ID header value when provided', () => {
    const { req, res, next } = makeMocks();
    (req.headers as Record<string, string>)['x-request-id'] = 'my-custom-id';
    requestId(req, res, next);
    expect(req.requestId).toBe('my-custom-id');
  });

  it('echoes requestId back in the X-Request-ID response header', () => {
    const { req, res, next } = makeMocks();
    requestId(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.requestId);
  });

  it('echoes the custom header value back in X-Request-ID response header', () => {
    const { req, res, next } = makeMocks();
    (req.headers as Record<string, string>)['x-request-id'] = 'trace-abc-123';
    requestId(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'trace-abc-123');
  });

  it('calls next() after attaching the request ID', () => {
    const { req, res, next } = makeMocks();
    requestId(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a different ID for each request', () => {
    const { req: r1, res: res1, next: n1 } = makeMocks();
    const { req: r2, res: res2, next: n2 } = makeMocks();
    requestId(r1, res1, n1);
    requestId(r2, res2, n2);
    expect(r1.requestId).not.toBe(r2.requestId);
  });
});
