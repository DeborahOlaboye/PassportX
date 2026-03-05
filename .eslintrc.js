module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // ── Variable hygiene ──────────────────────────────────────────────────────
    'no-unused-vars': 'off', // disabled in favour of the TS-aware version below
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',

    // ── Type safety ───────────────────────────────────────────────────────────
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // ── Security-critical rules ───────────────────────────────────────────────
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'eqeqeq': ['error', 'always'],
    'no-new-func': 'error',

    // ── Logging / information leakage ─────────────────────────────────────────
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // ── React hooks ───────────────────────────────────────────────────────────
    'react-hooks/exhaustive-deps': 'warn',

    // ── Project-specific suppressions (kept intentionally narrow) ─────────────
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'off',
    'react/display-name': 'off',
    'react/prop-types': 'off',
  },
  env: {
    node: true,
    jest: true,
    es6: true,
    browser: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    '**/*.test.*',
    '**/__tests__/*',
    '**/*.spec.*',
    '**/*.config.*',
    '**/.next/*',
    '**/node_modules/*',
    '**/dist/*',
    '**/out/*',
  ],
};
