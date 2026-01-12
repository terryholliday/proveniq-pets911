/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/**/?(*.)+(test).(ts|tsx|js)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/e2e/'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

module.exports = config;
