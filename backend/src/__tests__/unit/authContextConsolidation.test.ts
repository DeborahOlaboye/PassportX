/**
 * Regression tests for Issue #4 — duplicate AuthContext.
 *
 * File-content assertions that verify (without rendering React) that the
 * consolidation is correctly in place:
 *  - SDK context/AuthContext has 'use client' and a deprecation notice
 *  - hooks/useAuth re-exports from contexts/AuthContext (canonical)
 *  - index.ts no longer directly exports from context/AuthContext (SDK)
 *  - contexts/AuthContext uses the structured logger (no console.error)
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// __dirname → backend/src/__tests__/unit → up 4 levels → project root → src
const frontendSrc = join(__dirname, '..', '..', '..', '..', 'src');

function read(...parts: string[]): string {
  return readFileSync(join(frontendSrc, ...parts), 'utf8');
}

describe('AuthContext consolidation (Issue #4)', () => {
  describe('src/context/AuthContext (SDK layer)', () => {
    let content: string;
    beforeAll(() => { content = read('context', 'AuthContext.tsx'); });

    it("has 'use client' directive", () => {
      expect(content).toMatch(/^'use client'/m);
    });

    it('has a deprecation notice referencing contexts/AuthContext', () => {
      expect(content).toContain('@deprecated');
      expect(content).toContain('contexts/AuthContext');
    });
  });

  describe('src/hooks/useAuth (SDK re-export hook)', () => {
    let content: string;
    beforeAll(() => { content = read('hooks', 'useAuth.tsx'); });

    it('imports from contexts/AuthContext (canonical), not context/AuthContext (SDK)', () => {
      expect(content).toContain('contexts/AuthContext');
      expect(content).not.toMatch(/from ['"]\.\.\/context\/AuthContext['"]/);
    });

    it("has 'use client' directive", () => {
      expect(content).toMatch(/^'use client'/m);
    });
  });

  describe('src/index.ts (public SDK exports)', () => {
    let content: string;
    beforeAll(() => { content = read('index.ts'); });

    it('routes AuthProvider through hooks/useAuth (which delegates to canonical context)', () => {
      expect(content).toContain('./hooks/useAuth');
    });

    it('no longer exports AuthProvider directly from context/AuthContext', () => {
      expect(content).not.toMatch(
        /export\s+\{[^}]*AuthProvider[^}]*\}\s+from\s+['"]\.\/context\/AuthContext['"]/
      );
    });
  });

  describe('src/contexts/AuthContext (canonical app auth)', () => {
    let content: string;
    beforeAll(() => { content = read('contexts', 'AuthContext.tsx'); });

    it('exports the User interface', () => {
      expect(content).toContain('export interface User');
    });

    it('exports AuthContextType', () => {
      expect(content).toContain('export interface AuthContextType');
    });

    it('does not use console.error', () => {
      expect(content).not.toContain('console.error');
    });

    it('imports structured logger', () => {
      expect(content).toContain("from '@/utils/logger'");
    });
  });
});
