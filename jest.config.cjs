/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: [
    '<rootDir>/src/jest.setup.ts'
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json'
      },
    ],
  },
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  moduleDirectories: ['node_modules', 'src']
};