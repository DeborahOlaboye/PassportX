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
    // TypeScript strict rules
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-inferrable-types': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'react/display-name': 'off',
    'react/prop-types': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      // Relax explicit return type rules for Next.js pages, React components, hooks and contexts
      files: [
        'src/app/**/*.tsx',
        'src/app/**/*.ts',
        'src/components/**/*.tsx',
        'src/components/**/*.ts',
        'src/hooks/**/*.ts',
        'src/hooks/**/*.tsx',
        'src/contexts/**/*.tsx',
        'src/contexts/**/*.ts',
        'src/context/**/*.tsx',
        'src/context/**/*.ts',
      ],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    {
      // Legacy utility/library/service/config code — relax strict rules for gradual migration
      files: [
        'src/utils/**/*.ts',
        'src/utils/**/*.tsx',
        'src/lib/**/*.ts',
        'src/lib/**/*.tsx',
        'src/services/**/*.ts',
        'src/services/**/*.tsx',
        'src/config/**/*.ts',
        'src/config/**/*.tsx',
        'src/chainhook/**/*.ts',
      ],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
  ],
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
    // Backend is a separate Express application with its own tsconfig and
    // lint configuration – exclude it from the Next.js root linter.
    'backend/**',
    'contracts/**',
    'packages/**',
    'tests/**',
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
