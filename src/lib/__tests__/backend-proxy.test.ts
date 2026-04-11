import {
  parseBackendJson,
  proxyBackendResponse,
  isBackendErrorStatus,
  isBackendSuccessStatus,
  isJsonContentType,
  getBackendResponseMetadata,
} from '../backend-proxy';

function makeResponse(
  body: string,
  contentType: string,
  status = 200
): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': contentType },
  });
}

describe('parseBackendJson', () => {
  it('parses application/json responses', async () => {
    const res = makeResponse('{"ok":true}', 'application/json');
    const data = await parseBackendJson(res);
    expect(data).toEqual({ ok: true });
  });

  it('returns fallback object for HTML error pages', async () => {
    const res = makeResponse('<html>502 Bad Gateway</html>', 'text/html', 502);
    const data = await parseBackendJson(res);
    expect(data).toEqual({ error: '<html>502 Bad Gateway</html>' });
  });

  it('returns fallback object for plain text responses', async () => {
    const res = makeResponse('Service Unavailable', 'text/plain', 503);
    const data = await parseBackendJson(res);
    expect(data).toEqual({ error: 'Service Unavailable' });
  });

  it('returns statusText in fallback when body is empty', async () => {
    const res = makeResponse('', 'text/plain', 503);
    const data = await parseBackendJson(res);
    expect(data).toEqual({ error: 'Service Unavailable' });
  });

  it('handles application/json; charset=utf-8 content type', async () => {
    const res = makeResponse(
      '{"items":[1,2]}',
      'application/json; charset=utf-8'
    );
    const data = await parseBackendJson(res);
    expect(data).toEqual({ items: [1, 2] });
  });
});

describe('proxyBackendResponse', () => {
  it('preserves status code from backend response', async () => {
    const res = makeResponse('{"error":"not found"}', 'application/json', 404);
    const nextRes = await proxyBackendResponse(res);
    expect(nextRes.status).toBe(404);
  });

  it('forwards extra headers', async () => {
    const res = makeResponse('{"ok":true}', 'application/json', 200);
    const nextRes = await proxyBackendResponse(res, {
      'Cache-Control': 'public, s-maxage=60',
    });
    expect(nextRes.headers.get('Cache-Control')).toBe('public, s-maxage=60');
  });

  it('handles non-JSON backend bodies without throwing', async () => {
    const res = makeResponse('<html>Error</html>', 'text/html', 500);
    const nextRes = await proxyBackendResponse(res);
    expect(nextRes.status).toBe(500);
    const body = await nextRes.json();
    expect(body).toEqual({ error: '<html>Error</html>' });
  });
});

describe('isBackendErrorStatus', () => {
  it('identifies 4xx client errors correctly', () => {
    expect(isBackendErrorStatus(400)).toBe(true);
    expect(isBackendErrorStatus(404)).toBe(true);
    expect(isBackendErrorStatus(429)).toBe(true);
  });

  it('identifies 5xx server errors correctly', () => {
    expect(isBackendErrorStatus(500)).toBe(true);
    expect(isBackendErrorStatus(502)).toBe(true);
    expect(isBackendErrorStatus(503)).toBe(true);
  });

  it('returns false for non-error statuses', () => {
    expect(isBackendErrorStatus(200)).toBe(false);
    expect(isBackendErrorStatus(301)).toBe(false);
  });
});

describe('isBackendSuccessStatus', () => {
  it('identifies 2xx success responses', () => {
    expect(isBackendSuccessStatus(200)).toBe(true);
    expect(isBackendSuccessStatus(201)).toBe(true);
    expect(isBackendSuccessStatus(204)).toBe(true);
  });

  it('returns false for non-2xx statuses', () => {
    expect(isBackendSuccessStatus(100)).toBe(false);
    expect(isBackendSuccessStatus(301)).toBe(false);
    expect(isBackendSuccessStatus(400)).toBe(false);
    expect(isBackendSuccessStatus(500)).toBe(false);
  });
});

describe('isJsonContentType', () => {
  it('detects JSON content type', () => {
    const res = makeResponse('{}', 'application/json');
    expect(isJsonContentType(res)).toBe(true);
  });

  it('handles JSON with charset', () => {
    const res = makeResponse('{}', 'application/json; charset=utf-8');
    expect(isJsonContentType(res)).toBe(true);
  });

  it('returns false for non-JSON types', () => {
    expect(isJsonContentType(makeResponse('<html/>', 'text/html'))).toBe(false);
    expect(isJsonContentType(makeResponse('text', 'text/plain'))).toBe(false);
  });
});

describe('getBackendResponseMetadata', () => {
  it('extracts correct metadata from successful response', () => {
    const res = makeResponse('{"ok":true}', 'application/json', 200);
    const meta = getBackendResponseMetadata(res);

    expect(meta.statusCode).toBe(200);
    expect(meta.isSuccess).toBe(true);
    expect(meta.isError).toBe(false);
    expect(meta.isJson).toBe(true);
  });

  it('identifies error responses', () => {
    const res = makeResponse('{"error":"not found"}', 'application/json', 404);
    const meta = getBackendResponseMetadata(res);

    expect(meta.isError).toBe(true);
    expect(meta.isSuccess).toBe(false);
    expect(meta.statusCode).toBe(404);
  });

  it('handles non-JSON error responses', () => {
    const res = makeResponse(
      '<html>502 Bad Gateway</html>',
      'text/html',
      502
    );
    const meta = getBackendResponseMetadata(res);

    expect(meta.isError).toBe(true);
    expect(meta.isJson).toBe(false);
    expect(meta.contentType).toBe('text/html');
  });
});
