import { Request, Response } from 'express';
import { sendRouteError } from '../../utils/routeError';
import logger from '../../utils/logger';

jest.mock('../../utils/logger', () => ({
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

function makeMocks(requestId = 'test-req-id') {
  const req = { requestId } as unknown as Request;
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status } as unknown as Response;
  return { req, res, json, status };
}

describe('sendRouteError', () => {
  beforeEach(() => jest.clearAllMocks());

  it('responds with HTTP 500', () => {
    const { req, res, status } = makeMocks();
    sendRouteError(req, res, 'Something broke', new Error('boom'));
    expect(status).toHaveBeenCalledWith(500);
  });

  it('includes success: false in the response body', () => {
    const { req, res, json } = makeMocks();
    sendRouteError(req, res, 'Something broke', new Error('boom'));
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('includes the message in the response body', () => {
    const { req, res, json } = makeMocks();
    sendRouteError(req, res, 'Custom error message', new Error('boom'));
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Custom error message' })
    );
  });

  it('includes the requestId in the response body', () => {
    const { req, res, json } = makeMocks('req-abc-123');
    sendRouteError(req, res, 'Something broke', new Error('boom'));
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'req-abc-123' })
    );
  });

  it('calls logger.error with the message and requestId', () => {
    const { req, res } = makeMocks('req-xyz');
    sendRouteError(req, res, 'DB connection failed', new Error('timeout'));
    expect(logger.error).toHaveBeenCalledWith(
      'DB connection failed',
      expect.objectContaining({ requestId: 'req-xyz' })
    );
  });

  it('includes the error message in logger meta', () => {
    const { req, res } = makeMocks();
    sendRouteError(req, res, 'Oops', new Error('inner message'));
    expect(logger.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ error: 'inner message' })
    );
  });

  it('handles non-Error unknown values gracefully', () => {
    const { req, res, json } = makeMocks();
    sendRouteError(req, res, 'Unexpected', 'string error value');
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ error: 'string error value' })
    );
  });

  it('uses "unknown" requestId when req.requestId is undefined', () => {
    const req = {} as unknown as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;
    sendRouteError(req, res, 'No request ID', new Error('err'));
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'unknown' })
    );
  });
});
