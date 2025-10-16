module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prisma/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prisma'],
  env: {
    node: true,
    es6: true,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
    'prefer-const': 'error',
    'prisma/no-empty-blocks': 'warn',
    'prisma/prefer-field-defaults': 'warn',
    'prisma/prefer-unique-constraint': 'warn',
  },
  overrides: [
    {
      files: ['**/utils/logger.ts'],
      rules: {
        'no-console': 'off'
      }
    },
    {
      files: ['**/graphql/**/*.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      }
    },
    {
      files: ['**/prisma/seed.ts'],
      rules: {
        'no-console': 'off'
      }
    }
  ],
  ignorePatterns: ['dist', 'node_modules', 'generated', '*.js'],
};
