const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/.next/'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
}

module.exports = createJestConfig(customJestConfig)
