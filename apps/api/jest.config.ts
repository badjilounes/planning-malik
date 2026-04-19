export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  moduleNameMapper: {
    '^@planning/data-access$': '<rootDir>/../../libs/data-access/src/index.ts',
    '^@planning/types$': '<rootDir>/../../libs/types/src/index.ts',
    '^@planning/utils$': '<rootDir>/../../libs/utils/src/index.ts',
  },
};
