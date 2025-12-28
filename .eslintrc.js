module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['next/core-web-vitals'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Disable all rules by default
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-console': 'off',
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react/display-name': 'off',
    'react/prop-types': 'off',
    'prefer-const': 'off',
    'no-var': 'off',
    // Add any other rules you want to disable here
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
  // Ignore all test files and config files
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
