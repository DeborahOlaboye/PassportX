import { parseBackendJson, proxyBackendResponse } from '../backend-proxy';

function makeResponse(body: string, contentType: string, status = 200): Response {
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
    const res = makeResponse('{"items":[1,2]}', 'application/json; charset=utf-8');
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
