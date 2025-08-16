/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.e2e.test.ts'],

  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.json' }],
  },
  extensionsToTreatAsEsm: ['.ts'],

  moduleNameMapper: {
    // ✅ alias @ با و بدون .js
    '^@/(.*)\\.js$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',

    // ✅ برای import نسبی که با .js تمام می‌شود (ESM)
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  setupFilesAfterEnv: ['<rootDir>/test/jest.e2e.setup.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
};
