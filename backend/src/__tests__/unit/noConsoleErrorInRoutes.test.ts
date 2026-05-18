/**
 * Static assertion: confirms no route file in backend/src/routes/ still
 * contains a bare console.error call. This acts as a regression guard —
 * any future addition of console.error to a route will fail this test.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_DIR = path.resolve(__dirname, '../../routes');

function readRouteFiles(): { file: string; content: string }[] {
  return fs
    .readdirSync(ROUTES_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => ({
      file: f,
      content: fs.readFileSync(path.join(ROUTES_DIR, f), 'utf8'),
    }));
}

describe('backend route files — no bare console.error', () => {
  const routeFiles = readRouteFiles();

  it('should have at least one route file to check', () => {
    expect(routeFiles.length).toBeGreaterThan(0);
  });

  routeFiles.forEach(({ file, content }) => {
    it(`${file} does not contain console.error`, () => {
      const lines = content
        .split('\n')
        .filter((line) => /console\.error/.test(line));
      expect(lines).toEqual([]);
    });
  });
});

describe('backend route files — use sendRouteError or logger for errors', () => {
  const routeFiles = readRouteFiles();

  it('analytics.ts imports sendRouteError', () => {
    const analytics = routeFiles.find((f) => f.file === 'analytics.ts');
    expect(analytics?.content).toContain('sendRouteError');
  });

  it('badgeSearch.ts imports sendRouteError', () => {
    const badgeSearch = routeFiles.find((f) => f.file === 'badgeSearch.ts');
    expect(badgeSearch?.content).toContain('sendRouteError');
  });

  it('retry.ts imports sendRouteError', () => {
    const retry = routeFiles.find((f) => f.file === 'retry.ts');
    expect(retry?.content).toContain('sendRouteError');
  });

  it('accessControl.ts imports sendRouteError', () => {
    const ac = routeFiles.find((f) => f.file === 'accessControl.ts');
    expect(ac?.content).toContain('sendRouteError');
  });

  it('communityCreation.ts imports sendRouteError', () => {
    const cc = routeFiles.find((f) => f.file === 'communityCreation.ts');
    expect(cc?.content).toContain('sendRouteError');
  });
});
