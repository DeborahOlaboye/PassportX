/**
 * Regression guard: ensures no source file in backend/src uses the
 * `process.env.JWT_SECRET!` non-null assertion pattern (Issue #5).
 *
 * The non-null assertion bypasses TypeScript's null safety and causes an
 * unhandled TypeError at runtime when the env var is absent, leaking an
 * internal stack trace. All JWT operations must go through requireJwtSecret().
 */

import { execSync } from 'child_process';
import { join } from 'path';

const backendSrc = join(__dirname, '..', '..');

describe('No JWT_SECRET! non-null assertions in source (Issue #5)', () => {
  it('finds zero occurrences of process.env.JWT_SECRET! in non-test source', () => {
    let output = '';
    try {
      // grep exits 1 when no matches found (which is what we want)
      output = execSync(
        `grep -rn "process\\.env\\.JWT_SECRET!" "${backendSrc}" ` +
          `--include="*.ts" ` +
          `--exclude-dir=__tests__`,
        { encoding: 'utf8' }
      );
    } catch {
      // grep exit code 1 means no matches — this is the success case
      output = '';
    }

    // Filter out comment lines (lines where the match is inside a comment)
    const violations = output
      .split('\n')
      .filter((line) => line.trim() !== '')
      .filter((line) => !line.includes('* ') && !line.includes('// '));

    expect(violations).toHaveLength(0);
  });
});
