module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coveragePathIgnorePatterns: ['node_modules', 'src/lib'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/$1',
        '^@modules/(.*)$': '<rootDir>/modules/$1',
        '^@config/(.*)$': '<rootDir>/config/$1',
        '^@repo/(.*)$': '<rootDir>/repositories/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1',
        '^@models/(.*)$': '<rootDir>/models/$1',
        '^@constants/(.*)$': '<rootDir>/constants/$1',
        '^@tests/(.*)$': '<rootDir>/tests/$1',
        '^@lib/(.*)$': '<rootDir>/lib/$1',
        '^@/(.*)$': '<rootDir>/$',
    },
    setupFilesAfterEnv: ['jest-extended/all'],
};
